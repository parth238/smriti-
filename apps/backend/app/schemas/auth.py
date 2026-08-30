from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class CaregiverRegisterRequest(BaseModel):
    name: str = Field(min_length=1)
    phone: str = Field(min_length=8)
    email: EmailStr
    password: str = Field(min_length=8)


class CaregiverLoginRequest(BaseModel):
    phone_or_email: str
    password: str


class ElderlyCreateRequest(BaseModel):
    full_name: str = Field(min_length=1)
    phone: str | None = None
    preferred_language: str = "as"
    pin: str = Field(min_length=4, max_length=4, pattern=r"^\d{4}$")


class ElderlyLoginRequest(BaseModel):
    phone: str | None = None
    user_id: UUID | None = None
    pin: str = Field(min_length=4, max_length=4, pattern=r"^\d{4}$")


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenPairResponse(BaseModel):
    access_token: str
    refresh_token: str


class ElderlyCreateResponse(BaseModel):
    user_id: UUID
    pairing_code: str
