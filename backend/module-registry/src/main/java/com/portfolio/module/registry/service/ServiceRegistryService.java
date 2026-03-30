package com.portfolio.module.registry.service;

import com.portfolio.common.exception.DuplicateResourceException;
import com.portfolio.common.exception.ResourceNotFoundException;
import com.portfolio.domain.service.ServiceCache;
import com.portfolio.domain.service.ServiceRegistry;
import com.portfolio.domain.service.repository.ServiceCacheRepository;
import com.portfolio.domain.service.repository.ServiceRegistryRepository;
import com.portfolio.module.registry.dto.ServiceRegistryRequest;
import com.portfolio.module.registry.dto.ServiceStatusResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ServiceRegistryService {

    private final ServiceRegistryRepository registryRepository;
    private final ServiceCacheRepository cacheRepository;

    public List<ServiceStatusResponse> getAllServices() {
        return registryRepository.findByIsActiveTrue().stream()
                .map(registry -> {
                    ServiceCache cache = cacheRepository
                            .findTopByServiceNameOrderByLastCheckedAtDesc(registry.getServiceName())
                            .orElse(null);
                    return ServiceStatusResponse.from(registry, cache);
                })
                .toList();
    }

    public ServiceStatusResponse getService(String serviceName) {
        ServiceRegistry registry = registryRepository.findByServiceName(serviceName)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SERVICE_NOT_FOUND", "서비스를 찾을 수 없습니다: " + serviceName));

        ServiceCache cache = cacheRepository
                .findTopByServiceNameOrderByLastCheckedAtDesc(serviceName)
                .orElse(null);

        return ServiceStatusResponse.from(registry, cache);
    }

    @Transactional
    public ServiceStatusResponse registerService(ServiceRegistryRequest request) {
        registryRepository.findByServiceName(request.getServiceName())
                .ifPresent(existing -> {
                    throw new DuplicateResourceException(
                            "SERVICE_DUPLICATE", "이미 등록된 서비스입니다: " + request.getServiceName());
                });

        ServiceRegistry registry = ServiceRegistry.builder()
                .serviceName(request.getServiceName())
                .displayName(request.getDisplayName())
                .baseUrl(request.getBaseUrl())
                .healthPath(request.getHealthPath())
                .summaryPath(request.getSummaryPath())
                .build();

        registryRepository.save(registry);
        return ServiceStatusResponse.fromRegistryOnly(registry);
    }

    @Transactional
    public void deactivateService(String serviceName) {
        ServiceRegistry registry = registryRepository.findByServiceName(serviceName)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "SERVICE_NOT_FOUND", "서비스를 찾을 수 없습니다: " + serviceName));
        registry.deactivate();
    }
}
