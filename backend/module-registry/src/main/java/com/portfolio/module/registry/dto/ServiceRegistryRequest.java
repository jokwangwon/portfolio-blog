package com.portfolio.module.registry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ServiceRegistryRequest {

    @NotBlank(message = "서비스명은 필수입니다")
    @Size(max = 100)
    private String serviceName;

    @NotBlank(message = "표시명은 필수입니다")
    @Size(max = 200)
    private String displayName;

    @NotBlank(message = "Base URL은 필수입니다")
    @Size(max = 500)
    private String baseUrl;

    @Size(max = 200)
    private String healthPath;

    @Size(max = 200)
    private String summaryPath;
}
