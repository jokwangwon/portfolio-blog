package com.portfolio.domain.benchmark;

import com.portfolio.domain.user.User;
import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "benchmark_results")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@EntityListeners(AuditingEntityListener.class)
public class BenchmarkResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "model_id", nullable = false)
    private AiModel model;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "prompt_tokens", nullable = false)
    private Integer promptTokens;

    @Column(name = "generated_tokens", nullable = false)
    private Integer generatedTokens;

    @Column(name = "total_duration", nullable = false, precision = 10, scale = 3)
    private BigDecimal totalDuration;

    @Column(name = "tokens_per_second", nullable = false, precision = 8, scale = 2)
    private BigDecimal tokensPerSecond;

    @Column(name = "first_token_latency", nullable = false, precision = 8, scale = 3)
    private BigDecimal firstTokenLatency;

    @Column(name = "avg_gpu_utilization", precision = 5, scale = 2)
    private BigDecimal avgGpuUtilization;

    @Column(name = "max_memory_used")
    private Long maxMemoryUsed;

    @Column(name = "avg_temperature", precision = 5, scale = 2)
    private BigDecimal avgTemperature;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Builder
    public BenchmarkResult(AiModel model, User user, Integer promptTokens,
                          Integer generatedTokens, BigDecimal totalDuration,
                          BigDecimal tokensPerSecond, BigDecimal firstTokenLatency,
                          BigDecimal avgGpuUtilization, Long maxMemoryUsed,
                          BigDecimal avgTemperature) {
        this.model = model;
        this.user = user;
        this.promptTokens = promptTokens;
        this.generatedTokens = generatedTokens;
        this.totalDuration = totalDuration;
        this.tokensPerSecond = tokensPerSecond;
        this.firstTokenLatency = firstTokenLatency;
        this.avgGpuUtilization = avgGpuUtilization;
        this.maxMemoryUsed = maxMemoryUsed;
        this.avgTemperature = avgTemperature;
    }
}
