"""
AirNation Store — monitor de canales públicos de Telegram (stock / novedades).
Notifica por bot cuando se borra un mensaje o llega uno nuevo.
"""
from __future__ import annotations

import asyncio
import base64
import os
import traceback
from pathlib import Path

import requests
from dotenv import load_dotenv
from telethon import TelegramClient, events

load_dotenv()

API_ID = int(os.environ["TELEGRAM_API_ID"])
API_HASH = os.environ["TELEGRAM_API_HASH"]
BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
CHAT_ID = os.environ["TELEGRAM_CHAT_ID"]

_BASE = Path(__file__).resolve().parent
_SESSION_FILE = _BASE / "session.session"
_SESSION_BASE = str(_BASE / "session")

# Railway / despliegue: sesión embebida en base64 si no existe el archivo local
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


def notify(text: str) -> None:
    """Envía un mensaje al chat configurado vía Bot API."""
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

    @client.on(events.MessageDeleted(chats=CHANNELS))
    async def on_deleted(event: events.MessageDeleted.Event) -> None:
        ids = list(event.deleted_ids or [])
        title = "desconocido"
        try:
            if event.peer is not None:
                ent = await event.get_chat()
                title = getattr(ent, "title", None) or str(getattr(ent, "id", event.chat_id))
        except Exception:
            title = str(event.chat_id) if getattr(event, "chat_id", None) else "desconocido"

        notify(
            "AirNation · posible agotado\n"
            f"Canal: {title}\n"
            f"Mensajes borrados (IDs): {ids if ids else '(sin IDs)'}"
        )

    @client.on(events.NewMessage(chats=CHANNELS))
    async def on_new(event: events.NewMessage.Event) -> None:
        title = "desconocido"
        try:
            ent = await event.get_chat()
            title = getattr(ent, "title", None) or str(event.chat_id)
        except Exception:
            title = str(event.chat_id)

        body = (event.raw_text or "").strip()
        if len(body) > 1500:
            body = body[:1500] + "…"

        notify(
            "AirNation · novedad / mensaje nuevo\n"
            f"Canal: {title}\n\n"
            f"{body if body else '(sin texto / solo multimedia)'}"
        )

    await client.start()
    notify("AirNation Stock Monitor: conectado y escuchando canales.")
    await client.run_until_disconnected()


if __name__ == "__main__":
    asyncio.run(main())
