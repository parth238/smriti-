from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.router import api_router
from app.core.config import settings
from app.core.errors import SmritiError

app = FastAPI(title=settings.app_name, docs_url="/docs", redoc_url="/redoc")

media_dir = Path(__file__).resolve().parent.parent / "media"
media_dir.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(media_dir)), name="media")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(SmritiError)
async def smriti_error_handler(_request: Request, exc: SmritiError) -> JSONResponse:
    payload: dict[str, dict[str, str]] = {
        "error": {"code": exc.error_code, "message": exc.message}
    }
    if exc.field:
        payload["error"]["field"] = exc.field
    return JSONResponse(status_code=exc.status_code, content=payload)


app.include_router(api_router)

upload_root = Path(settings.upload_dir)
upload_root.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(upload_root)), name="uploads")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "smriti-api"}
