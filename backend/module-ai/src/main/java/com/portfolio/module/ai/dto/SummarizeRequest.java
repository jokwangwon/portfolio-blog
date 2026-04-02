package com.portfolio.module.ai.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SummarizeRequest {
    @NotBlank(message = "본문 내용은 필수입니다")
    private String content;

    private String title;

    private int maxLength = 200;
}
