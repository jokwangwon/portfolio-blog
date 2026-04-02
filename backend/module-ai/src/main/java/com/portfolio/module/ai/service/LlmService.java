package com.portfolio.module.ai.service;

import com.portfolio.module.ai.config.AiProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class LlmService {

    private static final Duration OLLAMA_TIMEOUT = Duration.ofMinutes(5);
    private static final Duration GEMINI_TIMEOUT = Duration.ofMinutes(2);
    private static final String GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

    private final AiProperties aiProperties;
    private final WebClient ollamaWebClient;
    private final WebClient geminiWebClient;

    public LlmService(
            @Qualifier("aiWebClientBuilder") WebClient.Builder webClientBuilder,
            AiProperties aiProperties) {
        this.aiProperties = aiProperties;
        this.ollamaWebClient = webClientBuilder.clone()
                .baseUrl(aiProperties.getOllamaHost())
                .build();
        this.geminiWebClient = webClientBuilder.clone()
                .baseUrl(GEMINI_API_BASE)
                .build();
    }

    /**
     * Notion 콘텐츠를 기반으로 블로그 초안을 생성한다.
     * ai.provider 설정에 따라 Ollama 또는 Gemini를 사용한다.
     */
    public Mono<String> generateDraft(String notionContent, String instructions) {
        String prompt = buildPrompt(notionContent, instructions);
        String provider = aiProperties.getProvider();

        log.info("LLM 초안 생성 시작 (provider: {})", provider);

        return switch (provider.toLowerCase()) {
            case "gemini" -> generateWithGemini(prompt);
            case "ollama" -> generateWithOllama(prompt);
            default -> {
                log.warn("알 수 없는 provider '{}', 기본값 ollama로 폴백", provider);
                yield generateWithOllama(prompt);
            }
        };
    }

    public String getProvider() {
        return aiProperties.getProvider();
    }

    @SuppressWarnings("unchecked")
    private Mono<String> generateWithOllama(String prompt) {
        Map<String, Object> requestBody = Map.of(
                "model", aiProperties.getOllamaModel(),
                "prompt", prompt,
                "stream", false,
                "options", Map.of(
                        "num_predict", 2048,
                        "temperature", 0.7
                )
        );

        return ollamaWebClient.post()
                .uri("/api/generate")
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .timeout(OLLAMA_TIMEOUT)
                .map(response -> {
                    String result = (String) response.get("response");
                    log.info("Ollama 초안 생성 완료 ({}자)", result != null ? result.length() : 0);
                    return result != null ? result : "";
                })
                .doOnError(e -> log.error("Ollama 호출 실패: {}", e.getMessage()));
    }

    @SuppressWarnings("unchecked")
    private Mono<String> generateWithGemini(String prompt) {
        Map<String, Object> requestBody = Map.of(
                "contents", List.of(
                        Map.of("parts", List.of(
                                Map.of("text", prompt)
                        ))
                )
        );

        return geminiWebClient.post()
                .uri("/models/{model}:generateContent?key={apiKey}",
                        aiProperties.getGeminiModel(),
                        aiProperties.getGeminiApiKey())
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(new ParameterizedTypeReference<Map<String, Object>>() {})
                .timeout(GEMINI_TIMEOUT)
                .map(response -> {
                    try {
                        List<Map<String, Object>> candidates =
                                (List<Map<String, Object>>) response.get("candidates");
                        if (candidates == null || candidates.isEmpty()) return "";

                        Map<String, Object> content =
                                (Map<String, Object>) candidates.get(0).get("content");
                        if (content == null) return "";

                        List<Map<String, Object>> parts =
                                (List<Map<String, Object>>) content.get("parts");
                        if (parts == null || parts.isEmpty()) return "";

                        String result = (String) parts.get(0).get("text");
                        log.info("Gemini 초안 생성 완료 ({}자)", result != null ? result.length() : 0);
                        return result != null ? result : "";
                    } catch (Exception e) {
                        log.error("Gemini 응답 파싱 실패: {}", e.getMessage());
                        return "";
                    }
                })
                .doOnError(e -> log.error("Gemini 호출 실패: {}", e.getMessage()));
    }

    private String buildPrompt(String notionContent, String instructions) {
        StringBuilder sb = new StringBuilder();
        sb.append("You are a professional blog post writer. ");
        sb.append("Based on the following Notion page content, generate a well-structured blog post draft.\n\n");

        if (instructions != null && !instructions.isBlank()) {
            sb.append("## Additional Instructions\n");
            sb.append(instructions).append("\n\n");
        }

        sb.append("## Source Content (from Notion)\n");
        sb.append(notionContent).append("\n\n");
        sb.append("## Requirements\n");
        sb.append("- Write in the same language as the source content\n");
        sb.append("- Use clear headings and structure\n");
        sb.append("- Keep the technical accuracy of the original content\n");
        sb.append("- Make it engaging and readable\n");
        sb.append("- Output in Markdown format\n");

        return sb.toString();
    }
}
