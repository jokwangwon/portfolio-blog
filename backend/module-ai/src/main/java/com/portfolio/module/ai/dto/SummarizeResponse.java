package com.portfolio.module.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SummarizeResponse {
    private String summary;
    private String provider;
    private long durationMs;
}
