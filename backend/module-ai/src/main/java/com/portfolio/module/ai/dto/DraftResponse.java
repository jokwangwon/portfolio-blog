package com.portfolio.module.ai.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class DraftResponse {

    private final String content;
    private final String provider;
    private final long durationMs;
}
