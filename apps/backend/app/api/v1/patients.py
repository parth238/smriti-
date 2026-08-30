from uuid import UUID

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.core.deps import get_current_principal
from app.core.errors import AuthorizationError
from app.db.session import get_db
from app.models.caregiver_user_link import CaregiverUserLink
from app.models.user import User

router = APIRouter()


class LinkedPatient(BaseModel):
    user_id: UUID
    full_name: str
    preferred_language: str
    is_primary: bool


@router.get("/me/patients", response_model=list[LinkedPatient])
def my_patients(
    principal: tuple[UUID, str] = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[LinkedPatient]:
    subject_id, role = principal
    if role != "caregiver":
        raise AuthorizationError("Only caregivers can list linked people")
    links = (
        db.query(CaregiverUserLink, User)
        .join(User, User.id == CaregiverUserLink.user_id)
        .filter(CaregiverUserLink.caregiver_id == subject_id)
        .all()
    )
    return [
        LinkedPatient(
            user_id=user.id,
            full_name=user.full_name,
            preferred_language=user.preferred_language,
            is_primary=link.is_primary,
        )
        for link, user in links
    ]
