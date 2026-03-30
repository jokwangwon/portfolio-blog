package com.portfolio.domain.service;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "service_cache")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class ServiceCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "service_name", nullable = false, length = 100)
    private String serviceName;

    @Column(nullable = false, length = 20)
    private String status = "UNKNOWN";

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "summary_data", columnDefinition = "jsonb")
    private Map<String, Object> summaryData;

    @Column(name = "last_checked_at", nullable = false)
    private LocalDateTime lastCheckedAt;

    @Column(name = "response_time_ms")
    private Integer responseTimeMs;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "consecutive_failures", nullable = false)
    private Integer consecutiveFailures = 0;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public ServiceCache(String serviceName, String status, Map<String, Object> summaryData,
                        Integer responseTimeMs, String errorMessage) {
        this.serviceName = serviceName;
        this.status = status != null ? status : "UNKNOWN";
        this.summaryData = summaryData;
        this.lastCheckedAt = LocalDateTime.now();
        this.responseTimeMs = responseTimeMs;
        this.errorMessage = errorMessage;
        this.consecutiveFailures = 0;
    }

    public void updateSuccess(String status, Map<String, Object> summaryData, Integer responseTimeMs) {
        this.status = status;
        this.summaryData = summaryData;
        this.responseTimeMs = responseTimeMs;
        this.lastCheckedAt = LocalDateTime.now();
        this.errorMessage = null;
        this.consecutiveFailures = 0;
    }

    public void updateFailure(String errorMessage) {
        this.status = "DOWN";
        this.lastCheckedAt = LocalDateTime.now();
        this.errorMessage = errorMessage;
        this.consecutiveFailures++;
    }
}
