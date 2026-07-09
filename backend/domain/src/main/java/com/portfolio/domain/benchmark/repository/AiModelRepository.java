package com.portfolio.domain.benchmark.repository;

import com.portfolio.domain.benchmark.AiModel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * @deprecated Planned for migration to ai-benchmark independent service.
 */
@Deprecated(since = "2026-04", forRemoval = false)
@Repository
public interface AiModelRepository extends JpaRepository<AiModel, Long> {

    Optional<AiModel> findBySlug(String slug);
}
