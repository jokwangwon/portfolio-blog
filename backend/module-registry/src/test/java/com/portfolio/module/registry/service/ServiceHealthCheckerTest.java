package com.portfolio.module.registry.service;

import com.portfolio.domain.service.ServiceCache;
import com.portfolio.domain.service.ServiceRegistry;
import com.portfolio.domain.service.repository.ServiceCacheRepository;
import com.portfolio.domain.service.repository.ServiceRegistryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ServiceHealthCheckerTest {

    @Mock
    private ServiceRegistryRepository registryRepository;
    @Mock
    private ServiceCacheRepository cacheRepository;
    @Mock
    private RestTemplate restTemplate;

    @InjectMocks
    private ServiceHealthChecker healthChecker;

    private ServiceRegistry registry;

    @BeforeEach
    void setUp() {
        registry = ServiceRegistry.builder()
                .serviceName("ai-benchmark-api")
                .displayName("AI Benchmark API")
                .baseUrl("http://ai-benchmark-api:8100")
                .build();
        ReflectionTestUtils.setField(registry, "id", 1L);
    }

    @Test
    @DisplayName("헬스체크 성공 시 캐시를 UP으로 업데이트한다")
    void updateCacheOnHealthSuccess() {
        @SuppressWarnings("unchecked")
        Map<String, Object> healthResponse = Map.of("status", "UP");

        given(registryRepository.findByIsActiveTrue()).willReturn(List.of(registry));
        given(restTemplate.getForObject(eq("http://ai-benchmark-api:8100/health"), eq(Map.class)))
                .willReturn(healthResponse);
        given(cacheRepository.findTopByServiceNameOrderByLastCheckedAtDesc("ai-benchmark-api"))
                .willReturn(Optional.empty());

        healthChecker.checkAllServices();

        ArgumentCaptor<ServiceCache> captor = ArgumentCaptor.forClass(ServiceCache.class);
        verify(cacheRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("UP");
        assertThat(captor.getValue().getServiceName()).isEqualTo("ai-benchmark-api");
    }

    @Test
    @DisplayName("헬스체크 실패 시 캐시를 DOWN으로 업데이트한다")
    void updateCacheOnHealthFailure() {
        given(registryRepository.findByIsActiveTrue()).willReturn(List.of(registry));
        given(restTemplate.getForObject(anyString(), eq(Map.class)))
                .willThrow(new RestClientException("Connection refused"));
        given(cacheRepository.findTopByServiceNameOrderByLastCheckedAtDesc("ai-benchmark-api"))
                .willReturn(Optional.empty());

        healthChecker.checkAllServices();

        ArgumentCaptor<ServiceCache> captor = ArgumentCaptor.forClass(ServiceCache.class);
        verify(cacheRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo("DOWN");
        assertThat(captor.getValue().getErrorMessage()).contains("Connection refused");
    }

    @Test
    @DisplayName("기존 캐시가 있으면 업데이트한다")
    void updateExistingCache() {
        ServiceCache existingCache = ServiceCache.builder()
                .serviceName("ai-benchmark-api")
                .status("DOWN")
                .errorMessage("previous error")
                .build();

        @SuppressWarnings("unchecked")
        Map<String, Object> healthResponse = Map.of("status", "UP");

        given(registryRepository.findByIsActiveTrue()).willReturn(List.of(registry));
        given(restTemplate.getForObject(anyString(), eq(Map.class)))
                .willReturn(healthResponse);
        given(cacheRepository.findTopByServiceNameOrderByLastCheckedAtDesc("ai-benchmark-api"))
                .willReturn(Optional.of(existingCache));

        healthChecker.checkAllServices();

        assertThat(existingCache.getStatus()).isEqualTo("UP");
        assertThat(existingCache.getErrorMessage()).isNull();
    }

    @Test
    @DisplayName("활성 서비스가 없으면 아무 작업도 하지 않는다")
    void doNothingWhenNoActiveServices() {
        given(registryRepository.findByIsActiveTrue()).willReturn(List.of());

        healthChecker.checkAllServices();

        verify(cacheRepository, never()).save(any());
    }

    @Test
    @DisplayName("실패 시 consecutiveFailures가 증가한다")
    void incrementConsecutiveFailures() {
        ServiceCache existingCache = ServiceCache.builder()
                .serviceName("ai-benchmark-api")
                .status("UP")
                .build();

        given(registryRepository.findByIsActiveTrue()).willReturn(List.of(registry));
        given(restTemplate.getForObject(anyString(), eq(Map.class)))
                .willThrow(new RestClientException("timeout"));
        given(cacheRepository.findTopByServiceNameOrderByLastCheckedAtDesc("ai-benchmark-api"))
                .willReturn(Optional.of(existingCache));

        healthChecker.checkAllServices();

        assertThat(existingCache.getConsecutiveFailures()).isEqualTo(1);
    }
}
