import logging

from fastapi import FastAPI, HTTPException
from app.config import settings
from app.schemas import (
    SummarizeRequest, SummarizeResponse,
    DraftRequest, DraftResponse,
)
from app import llm_service, notion_service

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="AI Backend",
    description="순수 연산 서비스 — LLM 요약, Notion 초안 생성",
    version="0.1.0",
)


@app.get("/health")
async def health():
    return {
        "status": "UP",
        "service": "ai-backend",
        "provider": settings.ai_provider,
        "stack": "python/fastapi",
    }


@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(req: SummarizeRequest):
    try:
        summary, duration_ms = llm_service.summarize(
            req.content, req.title, req.max_length
        )
        return SummarizeResponse(
            summary=summary,
            provider=settings.ai_provider,
            durationMs=duration_ms,
        )
    except Exception as e:
        logger.error("요약 실패: %s", e)
        raise HTTPException(status_code=503, detail=f"LLM 호출 실패: {e}")


@app.post("/generate-draft", response_model=DraftResponse)
async def generate_draft(req: DraftRequest):
    try:
        notion_content = await notion_service.read_page(req.notion_page_id)
        content, duration_ms = llm_service.generate_draft(
            notion_content, req.instructions
        )
        return DraftResponse(
            content=content,
            provider=settings.ai_provider,
            durationMs=duration_ms,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error("초안 생성 실패: %s", e)
        raise HTTPException(status_code=503, detail=f"초안 생성 실패: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=settings.port, reload=True)
