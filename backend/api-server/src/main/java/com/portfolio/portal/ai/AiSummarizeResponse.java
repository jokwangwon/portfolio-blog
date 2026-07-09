package com.portfolio.portal.ai;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class AiSummarizeResponse {
    private String summary;
    private String provider;
    private long durationMs;
}
