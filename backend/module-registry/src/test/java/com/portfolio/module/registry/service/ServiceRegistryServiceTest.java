package com.portfolio.module.registry.service;

import com.portfolio.common.exception.DuplicateResourceException;
import com.portfolio.common.exception.ResourceNotFoundException;
import com.portfolio.domain.service.ServiceCache;
import com.portfolio.domain.service.ServiceRegistry;
import com.portfolio.domain.service.repository.ServiceCacheRepository;
import com.portfolio.domain.service.repository.ServiceRegistryRepository;
import com.portfolio.module.registry.dto.ServiceRegistryRequest;
import com.portfolio.module.registry.dto.ServiceStatusResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class ServiceRegistryServiceTest {

    @Mock
    private ServiceRegistryRepository registryRepository;
    @Mock
    private ServiceCacheRepository cacheRepository;

    @InjectMocks
    private ServiceRegistryService service;

    private ServiceRegistry registry;
    private ServiceCache cache;

    @BeforeEach
    void setUp() {
        registry = ServiceRegistry.builder()
                .serviceName("ai-benchmark-api")
                .displayName("AI Benchmark API")
                .baseUrl("http://ai-benchmark-api:8100")
                .build();
        ReflectionTestUtils.setField(registry, "id", 1L);

        cache = ServiceCache.builder()
                .serviceName("ai-benchmark-api")
                .status("UP")
                .summaryData(Map.of("totalModels", 5))
                .responseTimeMs(120)
                .build();
    }

    @Nested
    @DisplayName("getAllServices")
    class GetAllServices {

        @Test
        @DisplayName("활성 서비스 목록과 캐시 상태를 함께 반환한다")
        void returnActiveServicesWithStatus() {
            given(registryRepository.findByIsActiveTrue()).willReturn(List.of(registry));
            given(cacheRepository.findTopByServiceNameOrderByLastCheckedAtDesc("ai-benchmark-api"))
                    .willReturn(Optional.of(cache));

            List<ServiceStatusResponse> result = service.getAllServices();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getServiceName()).isEqualTo("ai-benchmark-api");
            assertThat(result.get(0).getStatus()).isEqualTo("UP");
        }

        @Test
        @DisplayName("캐시가 없는 서비스는 UNKNOWN 상태로 반환한다")
        void returnUnknownWhenNoCacheExists() {
            given(registryRepository.findByIsActiveTrue()).willReturn(List.of(registry));
            given(cacheRepository.findTopByServiceNameOrderByLastCheckedAtDesc(anyString()))
                    .willReturn(Optional.empty());

            List<ServiceStatusResponse> result = service.getAllServices();

            assertThat(result.get(0).getStatus()).isEqualTo("UNKNOWN");
        }
    }

    @Nested
    @DisplayName("getService")
    class GetService {

        @Test
        @DisplayName("서비스명으로 상세 정보를 조회한다")
        void returnServiceByName() {
            given(registryRepository.findByServiceName("ai-benchmark-api"))
                    .willReturn(Optional.of(registry));
            given(cacheRepository.findTopByServiceNameOrderByLastCheckedAtDesc("ai-benchmark-api"))
                    .willReturn(Optional.of(cache));

            ServiceStatusResponse result = service.getService("ai-benchmark-api");

            assertThat(result.getServiceName()).isEqualTo("ai-benchmark-api");
            assertThat(result.getBaseUrl()).isEqualTo("http://ai-benchmark-api:8100");
        }

        @Test
        @DisplayName("존재하지 않는 서비스 조회 시 예외를 던진다")
        void throwWhenNotFound() {
            given(registryRepository.findByServiceName(anyString())).willReturn(Optional.empty());

            assertThatThrownBy(() -> service.getService("unknown"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("registerService")
    class RegisterService {

        @Test
        @DisplayName("새 서비스를 등록한다")
        void registerNewService() {
            ServiceRegistryRequest request = new ServiceRegistryRequest();
            ReflectionTestUtils.setField(request, "serviceName", "new-service");
            ReflectionTestUtils.setField(request, "displayName", "New Service");
            ReflectionTestUtils.setField(request, "baseUrl", "http://new-service:8200");

            given(registryRepository.findByServiceName("new-service")).willReturn(Optional.empty());
            given(registryRepository.save(any(ServiceRegistry.class))).willAnswer(inv -> {
                ServiceRegistry saved = inv.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 2L);
                return saved;
            });

            ServiceStatusResponse result = service.registerService(request);

            assertThat(result.getServiceName()).isEqualTo("new-service");
            verify(registryRepository).save(any(ServiceRegistry.class));
        }

        @Test
        @DisplayName("중복 서비스명 등록 시 예외를 던진다")
        void throwWhenDuplicate() {
            ServiceRegistryRequest request = new ServiceRegistryRequest();
            ReflectionTestUtils.setField(request, "serviceName", "ai-benchmark-api");
            ReflectionTestUtils.setField(request, "displayName", "AI Benchmark");
            ReflectionTestUtils.setField(request, "baseUrl", "http://localhost");

            given(registryRepository.findByServiceName("ai-benchmark-api"))
                    .willReturn(Optional.of(registry));

            assertThatThrownBy(() -> service.registerService(request))
                    .isInstanceOf(DuplicateResourceException.class);
        }
    }

    @Nested
    @DisplayName("deactivateService")
    class DeactivateService {

        @Test
        @DisplayName("서비스를 비활성화한다")
        void deactivateExistingService() {
            given(registryRepository.findByServiceName("ai-benchmark-api"))
                    .willReturn(Optional.of(registry));

            service.deactivateService("ai-benchmark-api");

            assertThat(registry.getIsActive()).isFalse();
        }

        @Test
        @DisplayName("존재하지 않는 서비스 비활성화 시 예외를 던진다")
        void throwWhenNotFound() {
            given(registryRepository.findByServiceName(anyString())).willReturn(Optional.empty());

            assertThatThrownBy(() -> service.deactivateService("unknown"))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
