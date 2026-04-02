package com.portfolio.ai.service;

import com.github.benmanes.caffeine.cache.Cache;
import com.portfolio.ai.config.AiProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

@Slf4j
@Service
public class NotionService {

    private static final String NOTION_API_BASE = "https://api.notion.com/v1";
    private static final String NOTION_VERSION = "2022-06-28";
    private static final int MAX_CONCURRENCY = 5;

    private final WebClient webClient;
    private final Cache<String, String> notionPageCache;

    public NotionService(WebClient.Builder webClientBuilder,
                         AiProperties aiProperties,
                         Cache<String, String> notionPageCache) {
        this.webClient = webClientBuilder
                .baseUrl(NOTION_API_BASE)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + aiProperties.getNotionApiKey())
                .defaultHeader("Notion-Version", NOTION_VERSION)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json")
                .build();
        this.notionPageCache = notionPageCache;
    }

    public Mono<String> readPage(String pageId) {
        String cached = notionPageCache.getIfPresent(pageId);
        if (cached != null) {
            log.debug("Notion 페이지 캐시 히트: {}", pageId);
            return Mono.just(cached);
        }

        log.info("Notion 페이지 조회 시작: {}", pageId);

        Mono<String> titleMono = fetchPageTitle(pageId);
        Mono<String> contentMono = fetchAllBlocks(pageId);

        return Mono.zip(titleMono, contentMono)
                .map(tuple -> {
                    String title = tuple.getT1();
                    String content = tuple.getT2();
                    String markdown = "# " + title + "\n\n" + content;
                    notionPageCache.put(pageId, markdown);
                    log.info("Notion 페이지 조회 완료: {} ({}자)", pageId, markdown.length());
                    return markdown;
                })
                .onErrorMap(WebClientResponseException.NotFound.class,
                        e -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                                "Notion 페이지를 찾을 수 없습니다: " + pageId))
                .onErrorMap(WebClientResponseException.Unauthorized.class,
                        e -> new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                                "Notion API 인증에 실패했습니다. API 키를 확인해주세요."));
    }

    private Mono<String> fetchPageTitle(String pageId) {
        return webClient.get()
                .uri("/pages/{pageId}", pageId)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .map(this::extractTitle)
                .onErrorReturn("Untitled");
    }

    @SuppressWarnings("unchecked")
    private String extractTitle(Map<String, Object> pageData) {
        try {
            Map<String, Object> properties = (Map<String, Object>) pageData.get("properties");
            if (properties == null) return "Untitled";

            for (Map.Entry<String, Object> entry : properties.entrySet()) {
                Map<String, Object> prop = (Map<String, Object>) entry.getValue();
                if ("title".equals(prop.get("type"))) {
                    List<Map<String, Object>> titleArray = (List<Map<String, Object>>) prop.get("title");
                    if (titleArray != null && !titleArray.isEmpty()) {
                        return titleArray.stream()
                                .map(t -> (String) t.get("plain_text"))
                                .collect(Collectors.joining());
                    }
                }
            }
        } catch (Exception e) {
            log.warn("페이지 제목 추출 실패: {}", e.getMessage());
        }
        return "Untitled";
    }

    private Mono<String> fetchAllBlocks(String pageId) {
        return fetchBlockChildren(pageId)
                .flatMap(blocks -> processBlocksRecursively(blocks, 0))
                .map(indexedContents -> indexedContents.stream()
                        .sorted(Comparator.comparingInt(IndexedContent::index))
                        .map(IndexedContent::content)
                        .collect(Collectors.joining("\n")));
    }

    @SuppressWarnings("unchecked")
    private Mono<List<Map<String, Object>>> fetchBlockChildren(String blockId) {
        return webClient.get()
                .uri("/blocks/{blockId}/children?page_size=100", blockId)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .expand(response -> {
                    Boolean hasMore = (Boolean) response.get("has_more");
                    if (Boolean.TRUE.equals(hasMore)) {
                        String nextCursor = (String) response.get("next_cursor");
                        return webClient.get()
                                .uri("/blocks/{blockId}/children?page_size=100&start_cursor={cursor}",
                                        blockId, nextCursor)
                                .retrieve()
                                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {});
                    }
                    return Mono.empty();
                })
                .flatMapIterable(response -> {
                    List<Map<String, Object>> results = (List<Map<String, Object>>) response.get("results");
                    return results != null ? results : Collections.emptyList();
                })
                .collectList();
    }

    private Mono<List<IndexedContent>> processBlocksRecursively(List<Map<String, Object>> blocks, int depth) {
        AtomicInteger index = new AtomicInteger(0);

        return Flux.fromIterable(blocks)
                .map(block -> new BlockWithIndex(block, index.getAndIncrement()))
                .flatMap(bwi -> {
                    String content = convertBlockToMarkdown(bwi.block(), depth);
                    Mono<List<IndexedContent>> childrenMono;

                    Boolean hasChildren = (Boolean) bwi.block().get("has_children");
                    if (Boolean.TRUE.equals(hasChildren)) {
                        String blockId = (String) bwi.block().get("id");
                        childrenMono = fetchBlockChildren(blockId)
                                .flatMap(children -> processBlocksRecursively(children, depth + 1));
                    } else {
                        childrenMono = Mono.just(Collections.emptyList());
                    }

                    return childrenMono.map(children -> {
                        List<IndexedContent> result = new ArrayList<>();
                        result.add(new IndexedContent(bwi.index(), content));
                        for (int i = 0; i < children.size(); i++) {
                            IndexedContent child = children.get(i);
                            result.add(new IndexedContent(
                                    bwi.index() * 1000 + child.index() + 1,
                                    child.content()));
                        }
                        return result;
                    });
                }, MAX_CONCURRENCY)
                .flatMapIterable(list -> list)
                .collectList();
    }

    @SuppressWarnings("unchecked")
    private String convertBlockToMarkdown(Map<String, Object> block, int depth) {
        String type = (String) block.get("type");
        if (type == null) return "";

        String indent = "  ".repeat(depth);
        Map<String, Object> typeData = (Map<String, Object>) block.get(type);

        return switch (type) {
            case "paragraph" -> indent + extractRichText(typeData);
            case "heading_1" -> "# " + extractRichText(typeData);
            case "heading_2" -> "## " + extractRichText(typeData);
            case "heading_3" -> "### " + extractRichText(typeData);
            case "bulleted_list_item" -> indent + "- " + extractRichText(typeData);
            case "numbered_list_item" -> indent + "1. " + extractRichText(typeData);
            case "toggle" -> indent + "<details><summary>" + extractRichText(typeData) + "</summary></details>";
            case "quote" -> indent + "> " + extractRichText(typeData);
            case "code" -> {
                String language = typeData != null ? (String) typeData.get("language") : "";
                yield indent + "```" + (language != null ? language : "") + "\n"
                        + indent + extractRichText(typeData) + "\n"
                        + indent + "```";
            }
            case "callout" -> {
                String icon = extractCalloutIcon(typeData);
                yield indent + "> " + icon + " " + extractRichText(typeData);
            }
            case "divider" -> indent + "---";
            case "to_do" -> {
                boolean checked = typeData != null && Boolean.TRUE.equals(typeData.get("checked"));
                yield indent + (checked ? "- [x] " : "- [ ] ") + extractRichText(typeData);
            }
            case "child_page" -> {
                String title = typeData != null ? (String) typeData.get("title") : "Untitled";
                yield indent + "**" + title + "**";
            }
            case "child_database" -> {
                String title = typeData != null ? (String) typeData.get("title") : "Untitled";
                yield indent + "**" + title + "**";
            }
            case "image" -> indent + extractMediaUrl(typeData, "image");
            case "bookmark" -> {
                String url = typeData != null ? (String) typeData.get("url") : "";
                yield indent + "[Bookmark](" + url + ")";
            }
            case "link_preview" -> {
                String url = typeData != null ? (String) typeData.get("url") : "";
                yield indent + "[Link](" + url + ")";
            }
            case "table_of_contents" -> indent + "[TOC]";
            default -> {
                log.debug("지원하지 않는 블록 타입: {}", type);
                yield "";
            }
        };
    }

    @SuppressWarnings("unchecked")
    private String extractRichText(Map<String, Object> typeData) {
        if (typeData == null) return "";
        List<Map<String, Object>> richTexts = (List<Map<String, Object>>) typeData.get("rich_text");
        if (richTexts == null || richTexts.isEmpty()) return "";

        return richTexts.stream()
                .map(rt -> {
                    String text = (String) rt.get("plain_text");
                    if (text == null) return "";
                    Map<String, Object> annotations = (Map<String, Object>) rt.get("annotations");
                    if (annotations != null) {
                        if (Boolean.TRUE.equals(annotations.get("bold"))) text = "**" + text + "**";
                        if (Boolean.TRUE.equals(annotations.get("italic"))) text = "*" + text + "*";
                        if (Boolean.TRUE.equals(annotations.get("strikethrough"))) text = "~~" + text + "~~";
                        if (Boolean.TRUE.equals(annotations.get("code"))) text = "`" + text + "`";
                    }
                    String href = (String) rt.get("href");
                    if (href != null) text = "[" + text + "](" + href + ")";
                    return text;
                })
                .collect(Collectors.joining());
    }

    @SuppressWarnings("unchecked")
    private String extractCalloutIcon(Map<String, Object> typeData) {
        if (typeData == null) return "";
        Map<String, Object> icon = (Map<String, Object>) typeData.get("icon");
        if (icon == null) return "";
        String iconType = (String) icon.get("type");
        if ("emoji".equals(iconType)) return (String) icon.get("emoji");
        return "";
    }

    @SuppressWarnings("unchecked")
    private String extractMediaUrl(Map<String, Object> typeData, String mediaType) {
        if (typeData == null) return "";
        String urlType = (String) typeData.get("type");
        if (urlType == null) return "";
        Map<String, Object> urlData = (Map<String, Object>) typeData.get(urlType);
        if (urlData == null) return "";
        String url = (String) urlData.get("url");
        if (url == null) return "";
        return "![" + mediaType + "](" + url + ")";
    }

    record BlockWithIndex(Map<String, Object> block, int index) {}
    record IndexedContent(int index, String content) {}
}
