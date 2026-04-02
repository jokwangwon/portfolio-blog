import logging
from functools import lru_cache

import httpx

from app.config import settings

logger = logging.getLogger(__name__)

NOTION_API_BASE = "https://api.notion.com/v1"
NOTION_VERSION = "2022-06-28"


def _headers() -> dict[str, str]:
    return {
        "Authorization": f"Bearer {settings.notion_api_key}",
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
    }


async def read_page(page_id: str) -> str:
    """Notion 페이지를 읽어 마크다운으로 반환."""
    async with httpx.AsyncClient(base_url=NOTION_API_BASE, headers=_headers(), timeout=30) as client:
        title = await _fetch_title(client, page_id)
        blocks = await _fetch_all_blocks(client, page_id)
        content = _blocks_to_markdown(blocks, depth=0)
        return f"# {title}\n\n{content}"


async def _fetch_title(client: httpx.AsyncClient, page_id: str) -> str:
    try:
        resp = await client.get(f"/pages/{page_id}")
        resp.raise_for_status()
        data = resp.json()
        properties = data.get("properties", {})
        for prop in properties.values():
            if prop.get("type") == "title":
                title_arr = prop.get("title", [])
                if title_arr:
                    return "".join(t.get("plain_text", "") for t in title_arr)
    except Exception as e:
        logger.warning("페이지 제목 추출 실패: %s", e)
    return "Untitled"


async def _fetch_all_blocks(client: httpx.AsyncClient, block_id: str) -> list[dict]:
    """커서 기반 페이지네이션으로 모든 블록 가져오기."""
    blocks = []
    cursor = None
    while True:
        params = {"page_size": 100}
        if cursor:
            params["start_cursor"] = cursor
        resp = await client.get(f"/blocks/{block_id}/children", params=params)
        resp.raise_for_status()
        data = resp.json()
        blocks.extend(data.get("results", []))

        if not data.get("has_more"):
            break
        cursor = data.get("next_cursor")

    # 자식 블록 재귀 fetch
    for block in blocks:
        if block.get("has_children"):
            block["_children"] = await _fetch_all_blocks(client, block["id"])

    return blocks


def _blocks_to_markdown(blocks: list[dict], depth: int) -> str:
    lines = []
    for block in blocks:
        line = _block_to_markdown(block, depth)
        if line:
            lines.append(line)
        children = block.get("_children", [])
        if children:
            lines.append(_blocks_to_markdown(children, depth + 1))
    return "\n".join(lines)


def _block_to_markdown(block: dict, depth: int) -> str:
    block_type = block.get("type", "")
    data = block.get(block_type, {})
    indent = "  " * depth

    match block_type:
        case "paragraph":
            return indent + _rich_text(data)
        case "heading_1":
            return f"# {_rich_text(data)}"
        case "heading_2":
            return f"## {_rich_text(data)}"
        case "heading_3":
            return f"### {_rich_text(data)}"
        case "bulleted_list_item":
            return f"{indent}- {_rich_text(data)}"
        case "numbered_list_item":
            return f"{indent}1. {_rich_text(data)}"
        case "to_do":
            checked = data.get("checked", False)
            marker = "- [x]" if checked else "- [ ]"
            return f"{indent}{marker} {_rich_text(data)}"
        case "toggle":
            return f"{indent}<details><summary>{_rich_text(data)}</summary></details>"
        case "quote":
            return f"{indent}> {_rich_text(data)}"
        case "code":
            lang = data.get("language", "")
            return f"{indent}```{lang}\n{indent}{_rich_text(data)}\n{indent}```"
        case "callout":
            icon = _callout_icon(data)
            return f"{indent}> {icon} {_rich_text(data)}"
        case "divider":
            return f"{indent}---"
        case "image":
            return f"{indent}{_media_url(data, 'image')}"
        case "bookmark":
            url = data.get("url", "")
            return f"{indent}[Bookmark]({url})"
        case _:
            return ""


def _rich_text(data: dict) -> str:
    texts = data.get("rich_text", [])
    parts = []
    for rt in texts:
        text = rt.get("plain_text", "")
        ann = rt.get("annotations", {})
        if ann.get("bold"):
            text = f"**{text}**"
        if ann.get("italic"):
            text = f"*{text}*"
        if ann.get("strikethrough"):
            text = f"~~{text}~~"
        if ann.get("code"):
            text = f"`{text}`"
        href = rt.get("href")
        if href:
            text = f"[{text}]({href})"
        parts.append(text)
    return "".join(parts)


def _callout_icon(data: dict) -> str:
    icon = data.get("icon", {})
    if icon.get("type") == "emoji":
        return icon.get("emoji", "")
    return ""


def _media_url(data: dict, media_type: str) -> str:
    url_type = data.get("type", "")
    url_data = data.get(url_type, {})
    url = url_data.get("url", "")
    return f"![{media_type}]({url})" if url else ""
