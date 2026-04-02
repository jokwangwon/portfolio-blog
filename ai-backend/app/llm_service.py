import time
import logging

from langchain_core.language_models import BaseChatModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_ollama import ChatOllama

from app.config import settings

logger = logging.getLogger(__name__)


def _build_model() -> BaseChatModel:
    if settings.ai_provider.lower() == "gemini":
        return ChatGoogleGenerativeAI(
            model=settings.gemini_model,
            google_api_key=settings.gemini_api_key,
            temperature=0.3,
            max_output_tokens=256,
            timeout=30,
        )
    return ChatOllama(
        base_url=settings.ollama_host,
        model=settings.ollama_model,
        temperature=0.3,
        timeout=60,
    )


def summarize(content: str, title: str, max_length: int) -> tuple[str, int]:
    """텍스트 요약. (summary, duration_ms) 반환."""
    model = _build_model()

    prompt = (
        f"다음 블로그 글의 핵심 내용을 한국어로 {max_length}자 이내로 요약해주세요.\n"
        f"- 요약문만 출력하세요 (부가 설명, 따옴표, 접두어 없이)\n"
        f"- 독자가 글의 핵심을 빠르게 파악할 수 있도록 작성하세요\n\n"
    )
    if title:
        prompt += f"제목: {title}\n\n"
    prompt += f"본문:\n{content}"

    start = time.time()
    result = model.invoke(prompt).content.strip()
    duration_ms = int((time.time() - start) * 1000)

    # 따옴표 제거
    if result.startswith('"') and result.endswith('"'):
        result = result[1:-1]

    # 길이 제한
    if len(result) > max_length:
        result = result[:max_length]

    logger.info(
        "Summarization completed: provider=%s, model=%s, durationMs=%d, length=%d",
        settings.ai_provider,
        settings.gemini_model if settings.ai_provider.lower() == "gemini" else settings.ollama_model,
        duration_ms,
        len(result),
    )
    return result, duration_ms


def generate_draft(notion_content: str, instructions: str) -> tuple[str, int]:
    """Notion 콘텐츠 기반 블로그 초안 생성. (content, duration_ms) 반환."""
    model = _build_model()

    prompt = (
        "You are a professional blog post writer. "
        "Based on the following Notion page content, generate a well-structured blog post draft.\n\n"
    )
    if instructions:
        prompt += f"## Additional Instructions\n{instructions}\n\n"
    prompt += (
        f"## Source Content (from Notion)\n{notion_content}\n\n"
        "## Requirements\n"
        "- Write in the same language as the source content\n"
        "- Use clear headings and structure\n"
        "- Keep the technical accuracy of the original content\n"
        "- Make it engaging and readable\n"
        "- Output in Markdown format\n"
    )

    start = time.time()
    result = model.invoke(prompt).content
    duration_ms = int((time.time() - start) * 1000)

    logger.info("Draft generation completed: provider=%s, durationMs=%d, length=%d",
                settings.ai_provider, duration_ms, len(result))
    return result, duration_ms
