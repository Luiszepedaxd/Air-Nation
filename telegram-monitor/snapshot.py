"""
Snapshot de catálogo: lee los canales de Airsoft Integral, descarga fotos,
extrae datos con OpenRouter (Claude 3 Haiku vision) y guarda catalogo_snapshot.csv.
"""
from __future__ import annotations

import asyncio
import base64
import csv
import json
import os
import re
import sys
import traceback
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv
from telethon import TelegramClient
from telethon.errors import FloodWaitError

load_dotenv()

API_ID = int(os.environ["TELEGRAM_API_ID"])
API_HASH = os.environ["TELEGRAM_API_HASH"]
OPENROUTER_API_KEY = os.environ["OPENROUTER_API_KEY"]
OPENROUTER_MODEL = os.environ.get(
    "OPENROUTER_MODEL", "anthropic/claude-3-haiku"
)

_BASE = Path(__file__).resolve().parent
_SESSION_FILE = _BASE / "session.session"
_SESSION_BASE = str(_BASE / "session")
_IMG_DIR = _BASE / "snapshot_images"
_CSV_PATH = _BASE / "catalogo_snapshot.csv"

_SESSION_B64 = os.environ.get("TELEGRAM_SESSION_B64", "").strip()
if _SESSION_B64 and not _SESSION_FILE.is_file():
    _SESSION_FILE.write_bytes(base64.b64decode(_SESSION_B64))

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

CHANNELS = [
    "AirsoftIntegral_Internos",
    "AirsoftIntegral_Miras",
    "AirsoftIntegral_Accesorios",
    "AirsoftIntegral_Gear",
    "AirsoftIntegral_BBsGasBattS",
]

VISION_PROMPT = """Eres un asistente que extrae datos de productos de airsoft de imágenes de catálogo. Extrae en JSON:
{
  "nombre": string,
  "precio_transferencia": number,
  "precio_tarjeta": number (si existe),
  "tipo": string (AEG/GBB/CO2/Spring/HPA/Accesorio/Gear/etc),
  "marca": string,
  "descripcion": string,
  "incluye": string,
  "en_stock": boolean
}
Si no puedes extraer un campo, ponlo null.
Responde únicamente con un único objeto JSON válido, sin markdown ni texto adicional."""


def _mime_from_bytes(data: bytes) -> str:
    if len(data) >= 3 and data[:3] == b"\xff\xd8\xff":
        return "image/jpeg"
    if len(data) >= 8 and data[:8] == b"\x89PNG\r\n\x1a\n":
        return "image/png"
    if len(data) >= 12 and data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "image/webp"
    if len(data) >= 6 and data[:6] in (b"GIF87a", b"GIF89a"):
        return "image/gif"
    return "image/jpeg"


def _ext_for_mime(mime: str) -> str:
    return {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/gif": ".gif",
    }.get(mime, ".jpg")


def _extract_json_obj(text: str) -> dict[str, Any] | None:
    text = text.strip()
    if not text:
        return None
    fence = re.search(r"```(?:json)?\s*(\{[\s\S]*?\})\s*```", text)
    if fence:
        try:
            return json.loads(fence.group(1))
        except json.JSONDecodeError:
            pass
    m = re.search(r"\{[\s\S]*\}", text)
    if m:
        try:
            return json.loads(m.group(0))
        except json.JSONDecodeError:
            pass
    return None


def _cell(v: Any) -> str:
    if v is None:
        return ""
    if isinstance(v, bool):
        return "True" if v else "False"
    return str(v)


def _call_openrouter_vision(
    data_url: str, caption: str
) -> dict[str, Any] | None:
    user_text = VISION_PROMPT
    if caption:
        user_text += f"\n\nTexto del mensaje en Telegram (caption):\n{caption}"

    body = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": user_text},
                    {
                        "type": "image_url",
                        "image_url": {"url": data_url},
                    },
                ],
            }
        ],
    }
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json",
        "HTTP-Referer": os.environ.get(
        "OPENROUTER_HTTP_REFERER", "https://localhost"
    ),
        "X-Title": "AirNation Catalog Snapshot",
    }
    r = requests.post(OPENROUTER_URL, headers=headers, json=body, timeout=120)
    r.raise_for_status()
    out = r.json()
    err = out.get("error")
    if err:
        raise RuntimeError(str(err))
    choices = out.get("choices") or []
    if not choices:
        raise RuntimeError("Sin choices en la respuesta de OpenRouter")
    content = choices[0].get("message", {}).get("content")
    if not content:
        raise RuntimeError("Contenido vacío del modelo")
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                parts.append(block.get("text", ""))
        content = "".join(parts)
    parsed = _extract_json_obj(content)
    return parsed


async def _download_photo_bytes(client: TelegramClient, message: Any) -> bytes | None:
    try:
        data = await client.download_media(message, file=bytes)
    except FloodWaitError as e:
        await asyncio.sleep(int(e.seconds) + 1)
        data = await client.download_media(message, file=bytes)
    if data is None:
        return None
    if isinstance(data, bytes):
        return data
    if isinstance(data, memoryview):
        return bytes(data)
    return bytes(data)


async def snapshot() -> None:
    _IMG_DIR.mkdir(parents=True, exist_ok=True)

    fieldnames = [
        "canal",
        "mensaje_id",
        "nombre",
        "precio_transferencia",
        "precio_tarjeta",
        "tipo",
        "marca",
        "descripcion",
        "incluye",
        "en_stock",
        "imagen_url",
    ]

    counts: dict[str, int] = {c: 0 for c in CHANNELS}
    client = TelegramClient(_SESSION_BASE, API_ID, API_HASH)

    with open(
        _CSV_PATH, "w", newline="", encoding="utf-8-sig"
    ) as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        csvfile.flush()

        await client.start()
        try:
            for canal in CHANNELS:
                processed = 0
                try:
                    entity = await client.get_entity(canal)
                except Exception:
                    print(
                        f"No se pudo resolver el canal: {canal}",
                        file=sys.stderr,
                    )
                    traceback.print_exc()
                    continue

                async for message in client.iter_messages(entity):
                    await asyncio.sleep(1)

                    if getattr(message, "photo", None) is None:
                        continue

                    raw = await _download_photo_bytes(client, message)
                    if not raw:
                        continue

                    processed += 1
                    print(f"Canal {canal}: {processed} mensajes procesados")

                    mime = _mime_from_bytes(raw)
                    ext = _ext_for_mime(mime)
                    safe_canal = re.sub(r"[^\w\-]+", "_", canal)
                    rel_name = f"snapshot_images/{safe_canal}/{message.id}{ext}"
                    out_path = _BASE / rel_name
                    out_path.parent.mkdir(parents=True, exist_ok=True)
                    out_path.write_bytes(raw)

                    caption = (getattr(message, "message", None) or "").strip()
                    data_url = f"data:{mime};base64,{base64.b64encode(raw).decode('ascii')}"

                    try:
                        extracted = await asyncio.to_thread(
                            _call_openrouter_vision, data_url, caption
                        )
                    except Exception:
                        print(
                            f"OpenRouter falló canal={canal} msg={message.id}:",
                            file=sys.stderr,
                        )
                        traceback.print_exc()
                        extracted = None

                    row = {
                        "canal": canal,
                        "mensaje_id": str(message.id),
                        "nombre": "",
                        "precio_transferencia": "",
                        "precio_tarjeta": "",
                        "tipo": "",
                        "marca": "",
                        "descripcion": "",
                        "incluye": "",
                        "en_stock": "",
                        "imagen_url": rel_name.replace("\\", "/"),
                    }
                    if extracted:
                        row["nombre"] = _cell(extracted.get("nombre"))
                        row["precio_transferencia"] = _cell(
                            extracted.get("precio_transferencia")
                        )
                        row["precio_tarjeta"] = _cell(
                            extracted.get("precio_tarjeta")
                        )
                        row["tipo"] = _cell(extracted.get("tipo"))
                        row["marca"] = _cell(extracted.get("marca"))
                        row["descripcion"] = _cell(extracted.get("descripcion"))
                        row["incluye"] = _cell(extracted.get("incluye"))
                        row["en_stock"] = _cell(extracted.get("en_stock"))

                    writer.writerow(row)
                    csvfile.flush()
                    counts[canal] = counts.get(canal, 0) + 1

                print(f"Canal {canal}: {processed} mensajes procesados (fin)")
        finally:
            await client.disconnect()

    print("\nResumen — productos encontrados por canal:")
    total = 0
    for c in CHANNELS:
        n = counts.get(c, 0)
        total += n
        print(f"  {c}: {n}")
    print(f"  TOTAL: {total}")
    print(f"\nCSV guardado en: {_CSV_PATH}")


def main() -> None:
    asyncio.run(snapshot())


if __name__ == "__main__":
    main()
