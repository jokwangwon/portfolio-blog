package com.portfolio.module.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class PostRequest {

    @NotBlank(message = "제목은 필수입니다")
    @Size(max = 255, message = "제목은 255자 이하여야 합니다")
    private String title;

    @NotBlank(message = "내용은 필수입니다")
    private String content;

    @Size(max = 200, message = "요약문은 200자 이하여야 합니다")
    private String excerpt;

    private Long categoryId;

    private List<Long> tagIds;

    private String status; // DRAFT, PUBLISHED
}
