package com.portfolio.module.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class DraftRequest {

    @NotBlank(message = "Notion 페이지 ID는 필수입니다")
    private String notionPageId;

    private String instructions;
}
