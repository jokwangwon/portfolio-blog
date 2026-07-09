package com.portfolio.module.benchmark.dto;

import com.portfolio.domain.benchmark.BenchmarkResult;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record BenchmarkResultResponse(
        Long id,
        String modelName,
        String modelSlug,
        Integer promptTokens,
        Integer generatedTokens,
        BigDecimal totalDuration,
        BigDecimal tokensPerSecond,
        BigDecimal firstTokenLatency,
        BigDecimal avgGpuUtilization,
        Long maxMemoryUsed,
        BigDecimal avgTemperature,
        LocalDateTime createdAt
) {
    public static BenchmarkResultResponse from(BenchmarkResult result) {
        return new BenchmarkResultResponse(
                result.getId(),
                result.getModel().getName(),
                result.getModel().getSlug(),
                result.getPromptTokens(),
                result.getGeneratedTokens(),
                result.getTotalDuration(),
                result.getTokensPerSecond(),
                result.getFirstTokenLatency(),
                result.getAvgGpuUtilization(),
                result.getMaxMemoryUsed(),
                result.getAvgTemperature(),
                result.getCreatedAt()
        );
    }
}
