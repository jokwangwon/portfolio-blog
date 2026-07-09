package com.portfolio.portal.ai;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.time.Duration;
import java.util.Map;

@Slf4j
@Component
public class AiClient {

    private static final Duration TIMEOUT = Duration.ofMinutes(3);

    private final WebClient webClient;

    public AiClient(@Value("${ai-backend.url:http://localhost:8081}") String aiBackendUrl,
                    WebClient.Builder builder) {
        this.webClient = builder.baseUrl(aiBackendUrl).build();
        log.info("AiClient initialized: url={}", aiBackendUrl);
    }

    @CircuitBreaker(name = "aiBackend", fallbackMethod = "summarizeFallback")
    @Retry(name = "aiBackend")
    public AiSummarizeResponse summarize(String content, String title, int maxLength) {
        Map<String, Object> request = Map.of(
                "content", content,
                "title", title != null ? title : "",
                "maxLength", maxLength
        );

        try {
            return webClient.post()
                    .uri("/summarize")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(AiSummarizeResponse.class)
                    .timeout(TIMEOUT)
                    .block();
        } catch (WebClientResponseException e) {
            log.error("ai-backend /summarize 호출 실패: status={}, body={}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new AiServiceException("AI 요약 서비스 호출에 실패했습니다");
        } catch (Exception e) {
            log.error("ai-backend /summarize 호출 실패: {}", e.getMessage());
            throw new AiServiceException("AI 요약 서비스에 연결할 수 없습니다");
        }
    }

    @CircuitBreaker(name = "aiBackend", fallbackMethod = "generateDraftFallback")
    @Retry(name = "aiBackend")
    public AiDraftResponse generateDraft(String notionPageId, String instructions) {
        Map<String, Object> request = Map.of(
                "notionPageId", notionPageId,
                "instructions", instructions != null ? instructions : ""
        );

        try {
            return webClient.post()
                    .uri("/generate-draft")
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(AiDraftResponse.class)
                    .timeout(TIMEOUT)
                    .block();
        } catch (WebClientResponseException e) {
            log.error("ai-backend /generate-draft 호출 실패: status={}, body={}",
                    e.getStatusCode(), e.getResponseBodyAsString());
            throw new AiServiceException("AI 초안 생성 서비스 호출에 실패했습니다");
        } catch (Exception e) {
            log.error("ai-backend /generate-draft 호출 실패: {}", e.getMessage());
            throw new AiServiceException("AI 초안 생성 서비스에 연결할 수 없습니다");
        }
    }

    // --- Resilience4j Fallback Methods ---

    private AiSummarizeResponse summarizeFallback(String content, String title, int maxLength, Throwable t) {
        log.warn("CircuitBreaker fallback for summarize: {}", t.getMessage());
        throw new AiServiceException("AI 요약 서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해 주세요.");
    }

    private AiDraftResponse generateDraftFallback(String notionPageId, String instructions, Throwable t) {
        log.warn("CircuitBreaker fallback for generateDraft: {}", t.getMessage());
        throw new AiServiceException("AI 초안 생성 서비스가 일시적으로 불안정합니다. 잠시 후 다시 시도해 주세요.");
    }
}
