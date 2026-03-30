package com.portfolio.portal.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.io.IOException;

import static org.assertj.core.api.Assertions.assertThat;

class MdcFilterTest {

    private final MdcFilter filter = new MdcFilter();

    @Test
    @DisplayName("요청 시 X-Request-Id 헤더를 응답에 설정한다")
    void setsRequestIdHeader() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/portal/posts");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, (req, res) -> {});

        assertThat(response.getHeader("X-Request-Id")).isNotNull();
        assertThat(response.getHeader("X-Request-Id")).hasSize(8);
    }

    @Test
    @DisplayName("필터 체인 실행 중 MDC에 request_id가 설정된다")
    void setsMdcDuringChain() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/portal/auth/login");
        MockHttpServletResponse response = new MockHttpServletResponse();

        String[] capturedRequestId = {null};
        String[] capturedPath = {null};

        FilterChain chain = (req, res) -> {
            capturedRequestId[0] = MDC.get("request_id");
            capturedPath[0] = MDC.get("request_path");
        };

        filter.doFilterInternal(request, response, chain);

        assertThat(capturedRequestId[0]).isNotNull().hasSize(8);
        assertThat(capturedPath[0]).isEqualTo("POST /api/portal/auth/login");
    }

    @Test
    @DisplayName("필터 완료 후 MDC가 정리된다")
    void clearsMdcAfterChain() throws ServletException, IOException {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/health");
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, (req, res) -> {});

        assertThat(MDC.get("request_id")).isNull();
        assertThat(MDC.get("request_path")).isNull();
    }
}
