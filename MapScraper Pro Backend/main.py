"""
MapScraper Pro — Python backend
Endpoints:
  GET  /api/v1/health
  POST /api/v1/scrape/stream   (SSE)
"""
import asyncio
import json
import logging
from typing import Optional

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

import scraper as gm_scraper

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)

app = FastAPI(title="MapScraper Pro Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class ScrapeRequest(BaseModel):
    category: str = Field(..., min_length=1)
    location: str = ""
    keywords: str = ""
    max_results: int = Field(default=60, ge=1, le=200)
    lat: float = 0.0
    lng: float = 0.0
    radius_m: float = Field(default=5000.0, ge=100.0)


@app.get("/api/v1/health")
async def health():
    return {"status": "ok", "backend": "playwright"}


@app.post("/api/v1/scrape/stream")
async def scrape_stream(body: ScrapeRequest, request: Request):
    log.info(
        "Scrape request: category=%s location=%s lat=%s lng=%s radius_m=%s max=%s",
        body.category, body.location, body.lat, body.lng, body.radius_m, body.max_results,
    )

    async def event_generator():
        count = 0
        try:
            async for biz in gm_scraper.scrape(
                category=body.category,
                location=body.location,
                lat=body.lat,
                lng=body.lng,
                radius_m=body.radius_m,
                max_results=body.max_results,
            ):
                if await request.is_disconnected():
                    log.info("Client disconnected, stopping scrape")
                    break
                if biz.get("_phone_update"):
                    payload = json.dumps({"type": "phone_update", "name": biz["name"], "phone": biz["phone"]})
                else:
                    payload = json.dumps({"type": "business", "data": biz})
                    count += 1
                yield f"data: {payload}\n\n"

        except Exception as exc:
            log.exception("Scrape error: %s", exc)
            error_payload = json.dumps({"type": "error", "message": str(exc)})
            yield f"data: {error_payload}\n\n"

        finally:
            log.info("Scrape done: %d businesses", count)
            yield f"data: {json.dumps({'type': 'done', 'count': count})}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )
