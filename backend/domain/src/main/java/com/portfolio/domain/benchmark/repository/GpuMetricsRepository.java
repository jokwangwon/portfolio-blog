package com.portfolio.domain.benchmark.repository;

import com.portfolio.domain.benchmark.GpuMetrics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GpuMetricsRepository extends JpaRepository<GpuMetrics, Long> {

    List<GpuMetrics> findByBenchmarkResultId(Long benchmarkResultId);
}
