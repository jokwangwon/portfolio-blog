package com.portfolio.module.ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ai")
public class AiProperties {

    /**
     * Notion Integration API Key
     */
    private String notionApiKey;

    /**
     * Google Gemini API Key
     */
    private String geminiApiKey;

    /**
     * Ollama server host (e.g., http://localhost:11434)
     */
    private String ollamaHost = "http://localhost:11434";

    /**
     * Ollama model name (e.g., llama3, mistral)
     */
    private String ollamaModel = "llama3";

    /**
     * Gemini model name (e.g., gemini-1.5-flash)
     */
    private String geminiModel = "gemini-1.5-flash";

    /**
     * LLM provider: "ollama" or "gemini"
     */
    private String provider = "ollama";
}
