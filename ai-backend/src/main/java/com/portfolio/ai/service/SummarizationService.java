package com.portfolio.ai.service;

import com.portfolio.ai.config.AiProperties;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.googleai.GoogleAiGeminiChatModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Slf4j
@Service
@RequiredArgsConstructor
public class SummarizationService {

    private final AiProperties aiProperties;

    public String summarize(String content, String title, int maxLength) {
        String provider = aiProperties.getProvider();
        ChatLanguageModel model = buildModel(provider);

        String prompt = buildSummarizePrompt(content, title, maxLength);

        long start = System.currentTimeMillis();
        String result = model.generate(prompt);
        long durationMs = System.currentTimeMillis() - start;

        result = result.strip();
        if (result.startsWith("\"") && result.endsWith("\"")) {
            result = result.substring(1, result.length() - 1);
        }

        if (result.length() > maxLength) {
            result = result.substring(0, maxLength);
        }

        log.info("Summarization completed: provider={}, model={}, durationMs={}, length={}",
                provider,
                provider.equalsIgnoreCase("gemini") ? aiProperties.getGeminiModel() : aiProperties.getOllamaModel(),
                durationMs, result.length());
        return result;
    }

    public String getProvider() {
        return aiProperties.getProvider();
    }

    private ChatLanguageModel buildModel(String provider) {
        if ("gemini".equalsIgnoreCase(provider)) {
            return GoogleAiGeminiChatModel.builder()
                    .apiKey(aiProperties.getGeminiApiKey())
                    .modelName(aiProperties.getGeminiModel())
                    .temperature(0.3)
                    .maxOutputTokens(256)
                    .timeout(Duration.ofSeconds(30))
                    .build();
        }
        return OllamaChatModel.builder()
                .baseUrl(aiProperties.getOllamaHost())
                .modelName(aiProperties.getOllamaModel())
                .temperature(0.3)
                .timeout(Duration.ofSeconds(60))
                .build();
    }

    private String buildSummarizePrompt(String content, String title, int maxLength) {
        StringBuilder sb = new StringBuilder();
        sb.append("다음 블로그 글의 핵심 내용을 한국어로 ").append(maxLength).append("자 이내로 요약해주세요.\n");
        sb.append("- 요약문만 출력하세요 (부가 설명, 따옴표, 접두어 없이)\n");
        sb.append("- 독자가 글의 핵심을 빠르게 파악할 수 있도록 작성하세요\n\n");
        if (title != null && !title.isBlank()) {
            sb.append("제목: ").append(title).append("\n\n");
        }
        sb.append("본문:\n").append(content);
        return sb.toString();
    }
}
