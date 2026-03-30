package com.portfolio.domain.service.repository;

import com.portfolio.domain.service.ServiceCache;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ServiceCacheRepository extends JpaRepository<ServiceCache, Long> {

    Optional<ServiceCache> findTopByServiceNameOrderByLastCheckedAtDesc(String serviceName);
}
