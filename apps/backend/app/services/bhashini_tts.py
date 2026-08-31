"""Optional Bhashini ULCA TTS proxy for Assamese speech."""

from __future__ import annotations

import base64
import logging

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

BHASHINI_PIPELINE_URL = (
    "https://dhruva-api.bhashini.gov.in/services/inference/pipeline"
)


def bhashini_configured() -> bool:
    return bool(settings.bhashini_api_key and settings.bhashini_tts_service_id)


async def synthesize_assamese(text: str) -> bytes | None:
    """Return WAV/MP3 bytes for Assamese text, or None if unavailable."""
    cleaned = text.strip()
    if not cleaned or not bhashini_configured():
        return None

    payload = {
        "pipelineTasks": [
            {
                "taskType": "tts",
                "config": {
                    "language": {"sourceLanguage": "as"},
                    "serviceId": settings.bhashini_tts_service_id,
                    "gender": settings.bhashini_tts_gender,
                    "samplingRate": 22050,
                },
            }
        ],
        "inputData": {"input": [{"source": cleaned}]},
    }
    headers = {
        "Authorization": settings.bhashini_api_key,
        "Content-Type": "application/json",
        "Accept": "*/*",
    }

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                BHASHINI_PIPELINE_URL, json=payload, headers=headers
            )
            if response.status_code != 200:
                logger.warning("Bhashini TTS HTTP %s", response.status_code)
                return None
            body = response.json()
            pipeline = body.get("pipelineResponse") or []
            if not pipeline:
                return None
            audio_block = pipeline[0].get("audio") or []
            if not audio_block:
                return None
            encoded = audio_block[0].get("audioContent")
            if not encoded:
                return None
            return base64.b64decode(encoded)
    except Exception as exc:  # noqa: BLE001 — network errors fall back to Web Speech
        logger.warning("Bhashini TTS failed: %s", exc)
        return None
