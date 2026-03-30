package com.portfolio.module.registry.dto;

import com.portfolio.domain.service.ServiceCache;
import com.portfolio.domain.service.ServiceRegistry;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.Map;

@Getter
@Builder
public class ServiceStatusResponse {
    private Long id;
    private String serviceName;
    private String displayName;
    private String baseUrl;
    private String healthPath;
    private String summaryPath;
    private boolean active;
    private String status;
    private Map<String, Object> summaryData;
    private Integer responseTimeMs;
    private String errorMessage;
    private LocalDateTime lastCheckedAt;

    public static ServiceStatusResponse from(ServiceRegistry registry, ServiceCache cache) {
        ServiceStatusResponseBuilder builder = ServiceStatusResponse.builder()
                .id(registry.getId())
                .serviceName(registry.getServiceName())
                .displayName(registry.getDisplayName())
                .baseUrl(registry.getBaseUrl())
                .healthPath(registry.getHealthPath())
                .summaryPath(registry.getSummaryPath())
                .active(registry.getIsActive());

        if (cache != null) {
            builder.status(cache.getStatus())
                    .summaryData(cache.getSummaryData())
                    .responseTimeMs(cache.getResponseTimeMs())
                    .errorMessage(cache.getErrorMessage())
                    .lastCheckedAt(cache.getLastCheckedAt());
        } else {
            builder.status("UNKNOWN");
        }

        return builder.build();
    }

    public static ServiceStatusResponse fromRegistryOnly(ServiceRegistry registry) {
        return from(registry, null);
    }
}
