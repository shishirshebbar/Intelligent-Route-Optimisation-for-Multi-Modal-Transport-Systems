# backend/app/dev/test_weather.py
import asyncio
from app.services.weather_client import fetch_current_weather

async def main():
    snap = await fetch_current_weather(12.9716, 77.5946)  # Bengaluru
    print('OK:', snap.model_dump())

if __name__ == "__main__":
    asyncio.run(main())
