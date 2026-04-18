"""
Autenticación inicial local para Telethon.
Ejecutar una vez: crea session.session en esta carpeta.
Sube session.session a Railway codificado en base64 (TELEGRAM_SESSION_B64).
"""
import asyncio
import os
from pathlib import Path

from dotenv import load_dotenv
from telethon import TelegramClient

load_dotenv()

_SESSION_DIR = Path(__file__).resolve().parent
_SESSION_NAME = str(_SESSION_DIR / "session")


def _require_env(name: str) -> str:
    v = os.environ.get(name, "").strip()
    if not v:
        raise SystemExit(f"Falta la variable de entorno {name}. Copia .env.example a .env y rellénala.")
    return v


async def main() -> None:
    api_id = int(_require_env("TELEGRAM_API_ID"))
    api_hash = _require_env("TELEGRAM_API_HASH")

    client = TelegramClient(_SESSION_NAME, api_id, api_hash)
    print("Iniciando sesión de Telegram (teléfono y código que recibirás en la app)...")
    await client.start()
    me = await client.get_me()
    print(f"Sesión guardada en: {_SESSION_NAME}.session")
    print(f"Conectado como: {me.first_name} (@{me.username or 'sin username'})")
    await client.disconnect()


if __name__ == "__main__":
    asyncio.run(main())
