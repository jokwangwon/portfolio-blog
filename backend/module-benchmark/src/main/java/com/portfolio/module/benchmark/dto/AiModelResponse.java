package com.portfolio.module.benchmark.dto;

import com.portfolio.domain.benchmark.AiModel;

import java.time.LocalDateTime;

public record AiModelResponse(
        Long id,
        String name,
        String slug,
        String type,
        String quantization,
        Long fileSize,
        LocalDateTime createdAt
) {
    public static AiModelResponse from(AiModel model) {
        return new AiModelResponse(
                model.getId(),
                model.getName(),
                model.getSlug(),
                model.getType(),
                model.getQuantization(),
                model.getFileSize(),
                model.getCreatedAt()
        );
    }
}
