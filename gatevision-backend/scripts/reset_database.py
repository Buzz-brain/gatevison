"""Drop every collection in the GateVision MongoDB database.

Usage:
    .\\venv\\Scripts\\python.exe scripts\\reset_database.py

WARNING: This deletes ALL persisted data: gate sessions, transactions,
decisions, vehicles, drivers, users, system records, uploads metadata, etc.
"""
import asyncio
import sys
from pathlib import Path

from pymongo import MongoClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.config.settings import settings


async def reset() -> None:
    client = MongoClient(settings.MONGODB_URI, serverSelectionTimeoutMS=5000)
    db = client[settings.DATABASE_NAME]
    collections = db.list_collection_names()
    for name in collections:
        db.drop_collection(name)
        print(f"dropped collection: {name}")
    client.close()
    print(f"done. {len(collections)} collection(s) dropped from '{settings.DATABASE_NAME}'.")


if __name__ == "__main__":
    asyncio.run(reset())
