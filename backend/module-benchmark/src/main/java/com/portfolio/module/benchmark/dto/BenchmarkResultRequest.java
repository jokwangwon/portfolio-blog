package com.portfolio.module.benchmark.dto;

import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record BenchmarkResultRequest(
        @NotNull(message = "모델 ID는 필수입니다")
        Long modelId,

        @NotNull(message = "프롬프트 토큰 수는 필수입니다")
        Integer promptTokens,

        @NotNull(message = "생성 토큰 수는 필수입니다")
        Integer generatedTokens,

        @NotNull(message = "총 소요 시간은 필수입니다")
        BigDecimal totalDuration,

        @NotNull(message = "초당 토큰 수는 필수입니다")
        BigDecimal tokensPerSecond,

        @NotNull(message = "첫 토큰 지연시간은 필수입니다")
        BigDecimal firstTokenLatency,

        BigDecimal avgGpuUtilization,
        Long maxMemoryUsed,
        BigDecimal avgTemperature
) {
}
