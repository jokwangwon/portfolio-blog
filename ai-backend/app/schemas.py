from pydantic import BaseModel, Field


class SummarizeRequest(BaseModel):
    content: str = Field(..., min_length=1)
    title: str = ""
    max_length: int = Field(default=200, alias="maxLength")

    class Config:
        populate_by_name = True


class SummarizeResponse(BaseModel):
    summary: str
    provider: str
    duration_ms: int = Field(alias="durationMs")

    class Config:
        populate_by_name = True
        by_alias = True


class DraftRequest(BaseModel):
    notion_page_id: str = Field(..., min_length=1, alias="notionPageId")
    instructions: str = ""

    class Config:
        populate_by_name = True


class DraftResponse(BaseModel):
    content: str
    provider: str
    duration_ms: int = Field(alias="durationMs")

    class Config:
        populate_by_name = True
        by_alias = True
