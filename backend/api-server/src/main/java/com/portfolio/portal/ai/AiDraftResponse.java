package com.portfolio.portal.ai;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@AllArgsConstructor
@NoArgsConstructor
public class AiDraftResponse {
    private String content;
    private String provider;
    private long durationMs;
}
