package com.portfolio.portal.health;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class HealthControllerTest {

    private final HealthController controller = new HealthController();

    @Test
    @DisplayName("/health 응답에 status=UP이 포함된다")
    void healthReturnsUp() {
        Map<String, Object> result = controller.health();

        assertThat(result.get("status")).isEqualTo("UP");
    }

    @Test
    @DisplayName("/health 응답에 service 이름이 포함된다")
    void healthContainsServiceName() {
        Map<String, Object> result = controller.health();

        assertThat(result.get("service")).isEqualTo("portfolio-portal-api");
    }

    @Test
    @DisplayName("/health 응답에 timestamp가 포함된다")
    void healthContainsTimestamp() {
        Map<String, Object> result = controller.health();

        assertThat(result).containsKey("timestamp");
    }

    @Test
    @DisplayName("/api/summary 응답에 서비스 정보가 포함된다")
    void summaryContainsServiceInfo() {
        Map<String, Object> result = controller.summary();

        assertThat(result.get("service")).isEqualTo("portfolio-portal-api");
        assertThat(result.get("version")).isNotNull();
        assertThat(result).containsKey("endpoints");
    }
}
