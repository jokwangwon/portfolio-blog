package com.portfolio.domain.benchmark;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "gpu_metrics")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class GpuMetrics {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private OffsetDateTime time;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "benchmark_id", nullable = false)
    private BenchmarkResult benchmarkResult;

    @Column(name = "gpu_utilization", precision = 5, scale = 2)
    private BigDecimal gpuUtilization;

    @Column(name = "memory_used")
    private Long memoryUsed;

    @Column(name = "memory_total")
    private Long memoryTotal;

    @Column(precision = 5, scale = 2)
    private BigDecimal temperature;

    @Column(name = "power_draw", precision = 7, scale = 2)
    private BigDecimal powerDraw;

    @Column(name = "fan_speed", precision = 5, scale = 2)
    private BigDecimal fanSpeed;

    @Builder
    public GpuMetrics(OffsetDateTime time, BenchmarkResult benchmarkResult,
                     BigDecimal gpuUtilization, Long memoryUsed, Long memoryTotal,
                     BigDecimal temperature, BigDecimal powerDraw, BigDecimal fanSpeed) {
        this.time = time;
        this.benchmarkResult = benchmarkResult;
        this.gpuUtilization = gpuUtilization;
        this.memoryUsed = memoryUsed;
        this.memoryTotal = memoryTotal;
        this.temperature = temperature;
        this.powerDraw = powerDraw;
        this.fanSpeed = fanSpeed;
    }
}
