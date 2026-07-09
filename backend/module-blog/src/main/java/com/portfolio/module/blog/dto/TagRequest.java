package com.portfolio.module.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class TagRequest {

    @NotBlank(message = "태그 이름은 필수입니다")
    @Size(max = 50, message = "태그 이름은 50자 이하여야 합니다")
    private String name;
}
