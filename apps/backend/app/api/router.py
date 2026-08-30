from fastapi import APIRouter

from app.api.v1 import analytics, auth, games, me, patients
from app.core.config import settings

api_router = APIRouter(prefix=settings.api_v1_prefix)
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(me.router, tags=["me"])
api_router.include_router(patients.router, tags=["patients"])
api_router.include_router(games.router, tags=["games"])
api_router.include_router(analytics.router, tags=["analytics"])
