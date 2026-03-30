package com.portfolio.module.registry.service;

import com.portfolio.domain.service.ServiceCache;
import com.portfolio.domain.service.ServiceRegistry;
import com.portfolio.domain.service.repository.ServiceCacheRepository;
import com.portfolio.domain.service.repository.ServiceRegistryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ServiceHealthChecker {

    private final ServiceRegistryRepository registryRepository;
    private final ServiceCacheRepository cacheRepository;
    private final RestTemplate restTemplate;

    @Scheduled(fixedDelayString = "${service.health-check.interval:60000}")
    public void checkAllServices() {
        registryRepository.findByIsActiveTrue().forEach(this::checkService);
    }

    private void checkService(ServiceRegistry registry) {
        String healthUrl = registry.getHealthUrl();
        ServiceCache cache = cacheRepository
                .findTopByServiceNameOrderByLastCheckedAtDesc(registry.getServiceName())
                .orElse(null);

        try {
            long start = System.currentTimeMillis();
            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.getForObject(healthUrl, Map.class);
            int responseTime = (int) (System.currentTimeMillis() - start);

            String status = response != null && "UP".equals(response.get("status")) ? "UP" : "DEGRADED";

            if (cache != null) {
                cache.updateSuccess(status, response, responseTime);
            } else {
                cache = ServiceCache.builder()
                        .serviceName(registry.getServiceName())
                        .status(status)
                        .summaryData(response)
                        .responseTimeMs(responseTime)
                        .build();
            }

            log.debug("Health check OK: {} ({}ms)", registry.getServiceName(), responseTime);

        } catch (Exception e) {
            String errorMsg = e.getMessage();

            if (cache != null) {
                cache.updateFailure(errorMsg);
            } else {
                cache = ServiceCache.builder()
                        .serviceName(registry.getServiceName())
                        .status("DOWN")
                        .errorMessage(errorMsg)
                        .build();
            }

            log.warn("Health check FAILED: {} - {}", registry.getServiceName(), errorMsg);
        }

        cacheRepository.save(cache);
    }
}
