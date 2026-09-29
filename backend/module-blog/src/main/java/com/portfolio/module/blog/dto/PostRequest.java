package com.portfolio.module.blog.dto;

import com.portfolio.domain.blog.PostVisibility;
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

    @jakarta.validation.constraints.Min(0)
    @jakarta.validation.constraints.Max(9007199254740991L)
    private Long expectedEditVersion;

    private Long categoryId;

    private List<Long> tagIds;

    private String status; // DRAFT, PUBLISHED, ARCHIVED

    private PostVisibility visibility; // create: PUBLIC default; update: null preserves existing value
}
