package com.portfolio.portal.integration;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("ServiceRegistry API 통합 테스트")
class ServiceRegistryApiIntegrationTest extends IntegrationTestBase {

    @Test
    @DisplayName("GET /api/portal/services 인증 없이 요청 시 → 401")
    void getServices_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/portal/services"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/portal/services/{name} 인증 없이 요청 시 → 401")
    void getServiceByName_withoutAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/portal/services/some-service"))
                .andExpect(status().isUnauthorized());
    }
}
