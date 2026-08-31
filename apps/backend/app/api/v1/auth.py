from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.deps import get_current_principal
from app.core.errors import (
    AuthenticationError,
    AuthorizationError,
    ConflictError,
    ValidationError,
)
from app.core.rate_limit import assert_not_locked, clear_failures, record_failure
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_password,
    verify_password,
)
from app.db.session import get_db
from app.models.caregiver import Caregiver
from app.models.caregiver_user_link import CaregiverUserLink
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import (
    CaregiverLoginRequest,
    CaregiverRegisterRequest,
    ElderlyCreateRequest,
    ElderlyCreateResponse,
    ElderlyLoginRequest,
    RefreshRequest,
    TokenPairResponse,
)

router = APIRouter()


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _issue_tokens(
    db: Session,
    subject_id: UUID,
    role: str,
    caregiver_id: UUID | None,
    user_id: UUID | None,
) -> TokenPairResponse:
    access_expires = None
    if role == "elderly_user":
        access_expires = timedelta(days=settings.elderly_access_token_expire_days)
    access = create_access_token(str(subject_id), role, access_expires)
    refresh = create_refresh_token(str(subject_id), role)
    expires = datetime.now(timezone.utc) + timedelta(
        days=settings.refresh_token_expire_days
    )
    db.add(
        RefreshToken(
            subject_id=subject_id,
            role=role,
            token_hash=hash_password(refresh),
            caregiver_id=caregiver_id,
            user_id=user_id,
            expires_at=expires,
        )
    )
    db.commit()
    return TokenPairResponse(access_token=access, refresh_token=refresh)


@router.post("/caregiver/register", response_model=TokenPairResponse, status_code=201)
def caregiver_register(
    body: CaregiverRegisterRequest,
    request: Request,
    db: Session = Depends(get_db),
) -> TokenPairResponse:
    ip_key = f"register-ip:{_client_ip(request)}"
    phone_key = f"register:{body.phone.lower()}"
    assert_not_locked(ip_key)
    assert_not_locked(phone_key)
    existing = (
        db.query(Caregiver)
        .filter(
            (Caregiver.phone_number == body.phone) | (Caregiver.email == body.email)
        )
        .first()
    )
    if existing is not None:
        record_failure(ip_key)
        record_failure(phone_key)
        raise ConflictError("An account with this phone or email already exists")
    caregiver = Caregiver(
        full_name=body.name,
        phone_number=body.phone,
        email=body.email,
        password_hash=hash_password(body.password),
    )
    db.add(caregiver)
    db.commit()
    db.refresh(caregiver)
    return _issue_tokens(db, caregiver.id, "caregiver", caregiver.id, None)


@router.post("/caregiver/login", response_model=TokenPairResponse)
def caregiver_login(
    body: CaregiverLoginRequest, db: Session = Depends(get_db)
) -> TokenPairResponse:
    key = f"caregiver:{body.phone_or_email.lower()}"
    assert_not_locked(key)
    caregiver = (
        db.query(Caregiver)
        .filter(
            (Caregiver.phone_number == body.phone_or_email)
            | (Caregiver.email == body.phone_or_email)
        )
        .first()
    )
    if caregiver is None or not verify_password(body.password, caregiver.password_hash):
        record_failure(key)
        raise AuthenticationError("Phone, email, or password is not correct")
    clear_failures(key)
    return _issue_tokens(db, caregiver.id, "caregiver", caregiver.id, None)


@router.post("/user/create", response_model=ElderlyCreateResponse, status_code=201)
def elderly_create(
    body: ElderlyCreateRequest,
    principal: tuple[UUID, str] = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> ElderlyCreateResponse:
    subject_id, role = principal
    if role != "caregiver":
        raise AuthorizationError("Only a caregiver can create this profile")
    if body.phone:
        exists = db.query(User).filter(User.phone_number == body.phone).first()
        if exists is not None:
            raise ConflictError("This phone is already linked to a profile")
    user = User(
        full_name=body.full_name,
        phone_number=body.phone,
        preferred_language=body.preferred_language,
        pin_hash=hash_password(body.pin),
        consent_given_by=subject_id,
        consent_timestamp=datetime.now(timezone.utc),
    )
    db.add(user)
    db.flush()
    db.add(
        CaregiverUserLink(
            caregiver_id=subject_id,
            user_id=user.id,
            relationship_label="primary",
            is_primary=True,
        )
    )
    db.commit()
    db.refresh(user)
    pairing = str(user.id).split("-")[0]
    return ElderlyCreateResponse(user_id=user.id, pairing_code=pairing)


@router.post("/user/login", response_model=TokenPairResponse)
def elderly_login(
    body: ElderlyLoginRequest, db: Session = Depends(get_db)
) -> TokenPairResponse:
    if body.user_id is None and not body.phone:
        raise ValidationError("Enter a phone number or pairing code")
    key = f"elderly:{(body.phone or str(body.user_id)).lower()}"
    assert_not_locked(key)
    query = db.query(User)
    if body.user_id is not None:
        query = query.filter(User.id == body.user_id)
    else:
        query = query.filter(User.phone_number == body.phone)
    user = query.first()
    if user is None or not verify_password(body.pin, user.pin_hash):
        record_failure(key)
        raise AuthenticationError("Phone or PIN is not correct")
    clear_failures(key)
    return _issue_tokens(db, user.id, "elderly_user", None, user.id)


@router.post("/refresh", response_model=TokenPairResponse)
def refresh_tokens(
    body: RefreshRequest, db: Session = Depends(get_db)
) -> TokenPairResponse:
    payload = decode_token(body.refresh_token)
    if payload.get("type") != "refresh":
        raise AuthenticationError("Refresh token is not valid")
    stored = (
        db.query(RefreshToken)
        .filter(RefreshToken.revoked_at.is_(None))
        .order_by(RefreshToken.created_at.desc())
        .all()
    )
    match = next(
        (row for row in stored if verify_password(body.refresh_token, row.token_hash)),
        None,
    )
    if match is None:
        raise AuthenticationError("Refresh token is not valid")
    match.revoked_at = datetime.now(timezone.utc)
    db.add(match)
    db.commit()
    return _issue_tokens(
        db, match.subject_id, match.role, match.caregiver_id, match.user_id
    )


@router.post("/logout")
def logout(body: RefreshRequest, db: Session = Depends(get_db)) -> dict[str, str]:
    stored = db.query(RefreshToken).filter(RefreshToken.revoked_at.is_(None)).all()
    for row in stored:
        if verify_password(body.refresh_token, row.token_hash):
            row.revoked_at = datetime.now(timezone.utc)
            db.add(row)
            db.commit()
            break
    return {"status": "signed_out"}
