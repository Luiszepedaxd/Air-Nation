"""
AirNation Store – monitor de canales públicos de Telegram (stock / novedades).
Notifica por bot cuando se borra un mensaje o llega uno nuevo.
"""
from __future__ import annotations

import asyncio
import base64
import os
import traceback
from pathlib import Path
from collections import OrderedDict

import requests
from dotenv import load_dotenv
from telethon import TelegramClient, events

load_dotenv()

API_ID   = int(os.environ["TELEGRAM_API_ID"])
API_HASH = os.environ["TELEGRAM_API_HASH"]
BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
CHAT_ID   = os.environ["TELEGRAM_CHAT_ID"]

_BASE         = Path(__file__).resolve().parent
_SESSION_FILE = _BASE / "session.session"
_SESSION_BASE = str(_BASE / "session")

_SESSION_B64 = os.environ.get("TELEGRAM_SESSION_B64", "").strip()
if _SESSION_B64 and not _SESSION_FILE.is_file():
    _SESSION_FILE.write_bytes(base64.b64decode(_SESSION_B64))

CHANNELS = [
    "AirsoftIntegral_Internos",
    "AirsoftIntegral_Miras",
    "AirsoftIntegral_Accesorios",
    "AirsoftIntegral_Gear",
    "AirsoftIntegral_BBsGasBattS",
]

# Caché: msg_id -> {"canal": str, "texto": str}
# OrderedDict para poder limitar tamaño y no crecer indefinidamente
_MSG_CACHE: OrderedDict[int, dict] = OrderedDict()
_CACHE_MAX = 2000  # guarda los últimos 2000 mensajes


def _cache_set(msg_id: int, canal: str, texto: str) -> None:
    _MSG_CACHE[msg_id] = {"canal": canal, "texto": texto}
    if len(_MSG_CACHE) > _CACHE_MAX:
        _MSG_CACHE.popitem(last=False)  # elimina el más antiguo


def notify(text: str) -> None:
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    try:
        resp = requests.post(
            url,
            json={"chat_id": CHAT_ID, "text": text},
            timeout=30,
        )
        resp.raise_for_status()
    except Exception:
        print("notify() falló:")
        traceback.print_exc()


async def main() -> None:
    client = TelegramClient(_SESSION_BASE, API_ID, API_HASH)

    @client.on(events.NewMessage(chats=CHANNELS))
    async def on_new(event: events.NewMessage.Event) -> None:
        canal = "desconocido"
        try:
            ent = await event.get_chat()
            canal = getattr(ent, "title", None) or str(event.chat_id)
        except Exception:
            canal = str(event.chat_id)

        body = (event.raw_text or "").strip()

        # Guardar en caché antes de notificar
        if event.message and event.message.id:
            _cache_set(event.message.id, canal, body[:500] if body else "(sin texto)")

        if len(body) > 1500:
            body = body[:1500] + "…"

        notify(
            f"AirNation · novedad / mensaje nuevo\n"
            f"Canal: {canal}\n\n"
            f"{body if body else '(sin texto / solo multimedia)'}"
        )

    @client.on(events.MessageDeleted(chats=CHANNELS))
    async def on_deleted(event: events.MessageDeleted.Event) -> None:
        ids = list(event.deleted_ids or [])

        canal = "desconocido"
        try:
            if event.peer is not None:
                ent = await event.get_chat()
                canal = getattr(ent, "title", None) or str(getattr(ent, "id", event.chat_id))
        except Exception:
            canal = str(event.chat_id) if getattr(event, "chat_id", None) else "desconocido"

        # Buscar contenido en caché
        lineas = []
        sin_cache = []
        for mid in ids:
            cached = _MSG_CACHE.get(mid)
            if cached:
                texto_preview = cached["texto"][:200] if cached["texto"] else "(sin texto)"
                lineas.append(f"  ID {mid}: {texto_preview}")
            else:
                sin_cache.append(str(mid))

        if lineas:
            detalle = "\n".join(lineas)
        elif sin_cache:
            detalle = f"IDs sin caché (llegaron antes de arrancar el monitor): {', '.join(sin_cache)}"
        else:
            detalle = "(sin IDs)"

        notify(
            f"AirNation · posible agotado ⚠️\n"
            f"Canal: {canal}\n"
            f"Mensajes borrados:\n{detalle}"
        )

    await client.start()
    notify("AirNation Stock Monitor: conectado y escuchando canales.")
    await client.run_until_disconnected()


if __name__ == "__main__":
    asyncio.run(main())
