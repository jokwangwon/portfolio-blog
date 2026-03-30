package com.portfolio.domain.service.repository;

import com.portfolio.domain.service.ServiceRegistry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ServiceRegistryRepository extends JpaRepository<ServiceRegistry, Long> {

    Optional<ServiceRegistry> findByServiceName(String serviceName);

    List<ServiceRegistry> findByIsActiveTrue();
}
