package com.portfolio.ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Getter
@Setter
@ConfigurationProperties(prefix = "ai")
public class AiProperties {

    private String notionApiKey;
    private String geminiApiKey;
    private String ollamaHost = "http://localhost:11434";
    private String ollamaModel = "llama3";
    private String geminiModel = "gemini-1.5-flash";
    private String provider = "ollama";
}
