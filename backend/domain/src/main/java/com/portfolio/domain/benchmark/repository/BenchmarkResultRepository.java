package com.portfolio.domain.benchmark.repository;

import com.portfolio.domain.benchmark.BenchmarkResult;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * @deprecated Planned for migration to ai-benchmark independent service.
 */
@Deprecated(since = "2026-04", forRemoval = false)
@Repository
public interface BenchmarkResultRepository extends JpaRepository<BenchmarkResult, Long> {

    Page<BenchmarkResult> findByModelId(Long modelId, Pageable pageable);
}
