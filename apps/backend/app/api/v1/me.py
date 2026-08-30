from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.deps import get_current_principal

router = APIRouter()


@router.get("/me")
def me(principal: tuple[UUID, str] = Depends(get_current_principal)) -> dict[str, str]:
    subject_id, role = principal
    return {"id": str(subject_id), "role": role}
