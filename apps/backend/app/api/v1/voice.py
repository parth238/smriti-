import base64

from fastapi import APIRouter
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field

from app.services.bhashini_tts import bhashini_configured, synthesize_assamese

router = APIRouter()


class TtsRequest(BaseModel):
    text: str = Field(min_length=1, max_length=500)


@router.get("/voice/status")
async def voice_status() -> dict[str, bool | str]:
    return {
        "bhashini_assamese_tts": bhashini_configured(),
        "note": (
            "Set BHASHINI_API_KEY and BHASHINI_TTS_SERVICE_ID in backend .env "
            "for real Assamese speech."
        ),
    }


@router.post("/voice/assamese-tts")
async def assamese_tts(body: TtsRequest) -> Response:
    audio = await synthesize_assamese(body.text)
    if audio is None:
        return JSONResponse(
            status_code=503,
            content={
                "error": {
                    "code": "TTS_UNAVAILABLE",
                    "message": (
                        "Bhashini Assamese TTS is not configured or unreachable. "
                        "Client should fall back to Web Speech."
                    ),
                }
            },
        )
    return Response(
        content=audio,
        media_type="audio/wav",
        headers={"X-TTS-Provider": "bhashini"},
    )


@router.post("/voice/assamese-tts/json")
async def assamese_tts_json(body: TtsRequest) -> dict[str, str]:
    """JSON wrapper for clients that prefer base64."""
    audio = await synthesize_assamese(body.text)
    if audio is None:
        return {"available": "false"}
    return {
        "available": "true",
        "audio_base64": base64.b64encode(audio).decode("ascii"),
        "mime": "audio/wav",
    }
