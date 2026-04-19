"""
Procesa imágenes locales con OpenRouter Vision (mismo modelo/prompt que snapshot.py)
y genera un CSV con datos extraídos por producto.
"""
from __future__ import annotations

import argparse
import base64
import csv
import json
import os
import re
import sys
import time
import traceback
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL = os.environ.get(
    "OPENROUTER_MODEL", "anthropic/claude-3-haiku"
)

_BASE = Path(__file__).resolve().parent
OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

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

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp"}


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


def _call_openrouter_vision(data_url: str) -> dict[str, Any] | None:
    body = {
        "model": OPENROUTER_MODEL,
        "messages": [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": VISION_PROMPT},
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
    return _extract_json_obj(content)


def _list_images(folder: Path) -> list[Path]:
    if not folder.is_dir():
        return []
    out: list[Path] = []
    for p in folder.iterdir():
        if not p.is_file():
            continue
        if p.suffix.lower() in IMAGE_SUFFIXES:
            out.append(p)
    out.sort(key=lambda x: x.name.lower())
    return out


def run(folder: Path, output: Path) -> None:
    if not OPENROUTER_API_KEY.strip():
        print("Falta OPENROUTER_API_KEY en .env", file=sys.stderr)
        sys.exit(1)

    images = _list_images(folder)
    n = len(images)
    if n == 0:
        print(f"No hay imágenes en: {folder}", file=sys.stderr)
        sys.exit(1)

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

    folder = folder.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)

    with open(output, "w", newline="", encoding="utf-8-sig") as csvfile:
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()

        for i, img_path in enumerate(images, start=1):
            print(f"Procesando {i}/{n}: {img_path.name}")
            raw = img_path.read_bytes()
            mime = _mime_from_bytes(raw)
            data_url = f"data:{mime};base64,{base64.b64encode(raw).decode('ascii')}"

            try:
                extracted = _call_openrouter_vision(data_url)
            except Exception:
                print(
                    f"OpenRouter falló archivo={img_path.name}:",
                    file=sys.stderr,
                )
                traceback.print_exc()
                extracted = None

            try:
                rel_url = str(img_path.resolve().relative_to(folder))
            except ValueError:
                rel_url = img_path.name
            rel_url = rel_url.replace("\\", "/")

            row = {
                "canal": "Drive_Replicas",
                "mensaje_id": img_path.name,
                "nombre": "",
                "precio_transferencia": "",
                "precio_tarjeta": "",
                "tipo": "",
                "marca": "",
                "descripcion": "",
                "incluye": "",
                "en_stock": "",
                "imagen_url": rel_url,
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

            if i < n:
                time.sleep(1)

    print(f"✅ {n} réplicas procesadas → {output}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Extrae datos de réplicas desde imágenes locales (OpenRouter Vision)."
    )
    parser.add_argument(
        "--folder",
        type=Path,
        default=_BASE / "../resources",
        help="Carpeta con imágenes (default: ../resources respecto a este script)",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=_BASE / "replicas_snapshot.csv",
        help="CSV de salida (default: replicas_snapshot.csv junto al script)",
    )
    args = parser.parse_args()
    folder = args.folder.expanduser().resolve()
    output = args.output.expanduser()
    if not output.is_absolute():
        output = (_BASE / output).resolve()
    else:
        output = output.resolve()
    run(folder, output)


if __name__ == "__main__":
    main()
