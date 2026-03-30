package com.portfolio.domain.service;

import com.portfolio.domain.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "service_registry")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ServiceRegistry extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "service_name", nullable = false, unique = true, length = 100)
    private String serviceName;

    @Column(name = "display_name", nullable = false, length = 200)
    private String displayName;

    @Column(name = "base_url", nullable = false, length = 500)
    private String baseUrl;

    @Column(name = "health_path", nullable = false, length = 200)
    private String healthPath = "/health";

    @Column(name = "summary_path", nullable = false, length = 200)
    private String summaryPath = "/api/summary";

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Builder
    public ServiceRegistry(String serviceName, String displayName, String baseUrl,
                           String healthPath, String summaryPath) {
        this.serviceName = serviceName;
        this.displayName = displayName;
        this.baseUrl = baseUrl;
        this.healthPath = healthPath != null ? healthPath : "/health";
        this.summaryPath = summaryPath != null ? summaryPath : "/api/summary";
        this.isActive = true;
    }

    public void deactivate() {
        this.isActive = false;
    }

    public void activate() {
        this.isActive = true;
    }

    public String getHealthUrl() {
        return baseUrl + healthPath;
    }

    public String getSummaryUrl() {
        return baseUrl + summaryPath;
    }
}
