from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from sqlalchemy.orm import Session

from app.core.deps import (
    get_current_principal,
    require_caregiver,
    verify_caregiver_linked,
    verify_user_access,
)
from app.core.errors import NotFoundError
from app.db.session import get_db
from app.schemas.memories import (
    CulturalPackItem,
    CulturalPackResponse,
    MemoryItemRow,
    MemoryItemUpdate,
)
from app.services.memories import (
    create_memory_item,
    delete_memory_item,
    get_memory_item,
    list_memory_items,
    load_cultural_pack,
    save_upload,
    update_memory_item,
)

router = APIRouter()


def _row(item) -> MemoryItemRow:
    return MemoryItemRow(
        id=item.id,
        user_id=item.user_id,
        media_url=item.media_url,
        media_type=item.media_type,
        category=item.category,
        title=item.title,
        description=item.description,
        people_tagged=item.people_tagged,
        year=item.year,
        location=item.location,
        prompt_text=item.prompt_text,
        created_at=item.created_at,
    )


@router.get("/memory-items", response_model=list[MemoryItemRow])
def get_memory_items(
    user_id: UUID = Query(...),
    category: str | None = None,
    principal: tuple[UUID, str] = Depends(get_current_principal),
    db: Session = Depends(get_db),
) -> list[MemoryItemRow]:
    verify_user_access(user_id, principal, db)
    rows = list_memory_items(db, user_id=user_id, category=category)
    return [_row(row) for row in rows]


@router.get("/memory-items/cultural-pack", response_model=CulturalPackResponse)
def cultural_pack(
    language: str = Query("as", min_length=2, max_length=12)
) -> CulturalPackResponse:
    data = load_cultural_pack(language)
    items = [
        CulturalPackItem(
            id=item["id"],
            scene=item["scene"],
            title_key=item["titleKey"],
            prompt_key=item["promptKey"],
            state=item["state"],
            source=item["source"],
        )
        for item in data.get("items", [])
    ]
    return CulturalPackResponse(
        region=data.get("region", "Assam"),
        language=data.get("language", language),
        source=data.get("source", ""),
        items=items,
    )


@router.post("/memory-items", response_model=MemoryItemRow, status_code=201)
async def post_memory_item(
    user_id: UUID = Form(...),
    category: str = Form("family"),
    title_en: str = Form(...),
    title_as: str | None = Form(None),
    description: str | None = Form(None),
    people_tagged: str | None = Form(None),
    year: int | None = Form(None),
    location: str | None = Form(None),
    prompt_en: str | None = Form(None),
    prompt_as: str | None = Form(None),
    file: UploadFile = File(...),
    caregiver_id: UUID = Depends(require_caregiver),
    db: Session = Depends(get_db),
) -> MemoryItemRow:
    verify_caregiver_linked(user_id, caregiver_id, db)
    media_url, media_type = await save_upload(file, user_id=user_id)
    title = {"en": title_en}
    if title_as:
        title["as"] = title_as
    prompt_text = None
    if prompt_en:
        prompt_text = {"en": prompt_en}
        if prompt_as:
            prompt_text["as"] = prompt_as
    tagged = None
    if people_tagged:
        tagged = [part.strip() for part in people_tagged.split(",") if part.strip()]
    item = create_memory_item(
        db,
        user_id=user_id,
        caregiver_id=caregiver_id,
        media_url=media_url,
        media_type=media_type,
        category=category,
        title=title,
        description=description,
        people_tagged=tagged,
        year=year,
        location=location,
        prompt_text=prompt_text,
    )
    return _row(item)


@router.patch("/memory-items/{item_id}", response_model=MemoryItemRow)
def patch_memory_item(
    item_id: UUID,
    body: MemoryItemUpdate,
    caregiver_id: UUID = Depends(require_caregiver),
    db: Session = Depends(get_db),
) -> MemoryItemRow:
    item = get_memory_item(db, item_id)
    if item.user_id is None:
        raise NotFoundError("Memory item was not found")
    verify_caregiver_linked(item.user_id, caregiver_id, db)
    title = None
    if body.title is not None:
        title = {"en": body.title.en}
        if body.title.as_:
            title["as"] = body.title.as_
    prompt_text = None
    if body.prompt_text is not None:
        prompt_text = {"en": body.prompt_text.en}
        if body.prompt_text.as_:
            prompt_text["as"] = body.prompt_text.as_
    updated = update_memory_item(
        db,
        item,
        title=title,
        description=body.description,
        people_tagged=body.people_tagged,
        year=body.year,
        location=body.location,
        prompt_text=prompt_text,
    )
    if body.category is not None:
        updated.category = body.category
        db.commit()
        db.refresh(updated)
    return _row(updated)


@router.delete("/memory-items/{item_id}", status_code=204)
def remove_memory_item(
    item_id: UUID,
    caregiver_id: UUID = Depends(require_caregiver),
    db: Session = Depends(get_db),
) -> None:
    item = get_memory_item(db, item_id)
    if item.user_id is None:
        raise NotFoundError("Memory item was not found")
    verify_caregiver_linked(item.user_id, caregiver_id, db)
    delete_memory_item(db, item)
