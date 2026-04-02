package com.portfolio.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class SummarizeResponse {
    private String summary;
    private String provider;
    private long durationMs;
}
