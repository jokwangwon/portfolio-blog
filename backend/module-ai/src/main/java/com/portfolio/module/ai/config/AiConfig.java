package com.portfolio.module.ai.config;

import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

@Configuration
@EnableConfigurationProperties(AiProperties.class)
public class AiConfig {

    @Bean("aiWebClientBuilder")
    public WebClient.Builder aiWebClientBuilder() {
        return WebClient.builder()
                .codecs(configurer -> configurer
                        .defaultCodecs()
                        .maxInMemorySize(10 * 1024 * 1024)); // 10MB
    }

    @Bean("notionPageCache")
    public Cache<String, String> notionPageCache() {
        return Caffeine.newBuilder()
                .maximumSize(50)
                .expireAfterWrite(Duration.ofMinutes(10))
                .build();
    }
}
