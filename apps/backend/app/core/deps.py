from uuid import UUID

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.errors import AuthenticationError, AuthorizationError
from app.core.security import parse_subject
from app.db.session import get_db
from app.models.caregiver_user_link import CaregiverUserLink

bearer = HTTPBearer(auto_error=False)


def get_current_principal(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> tuple[UUID, str]:
    if credentials is None or not credentials.credentials:
        raise AuthenticationError("Sign in is required")
    return parse_subject(credentials.credentials)


def verify_user_access(
    user_id: UUID,
    principal: tuple[UUID, str] = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> tuple[UUID, str]:
    subject_id, role = principal
    if role == "elderly_user":
        if subject_id != user_id:
            raise AuthorizationError("You can only open your own information")
        return principal
    if role == "caregiver":
        link = (
            db.query(CaregiverUserLink)
            .filter(
                CaregiverUserLink.caregiver_id == subject_id,
                CaregiverUserLink.user_id == user_id,
            )
            .first()
        )
        if link is None:
            raise AuthorizationError("This person is not linked to you")
        return principal
    raise AuthorizationError("This action is not allowed")
