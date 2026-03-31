package com.portfolio.portal.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.domain.user.repository.RefreshTokenRepository;
import com.portfolio.domain.user.repository.UserRepository;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("Auth API 통합 테스트")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthApiIntegrationTest extends IntegrationTestBase {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Test
    @Order(1)
    @DisplayName("회원가입 성공 → 201 + accessToken + refresh_token 쿠키")
    void signup_success() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/portal/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupJson("test@example.com", "testuser", "Password123")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.expiresIn").isNumber())
                .andReturn();

        Cookie refreshCookie = result.getResponse().getCookie("refresh_token");
        assertThat(refreshCookie).isNotNull();
        assertThat(refreshCookie.isHttpOnly()).isTrue();
        assertThat(refreshCookie.getPath()).isEqualTo("/api/portal/auth");

        assertThat(userRepository.existsByEmail("test@example.com")).isTrue();
        assertThat(userRepository.existsByUsername("testuser")).isTrue();
    }

    @Test
    @Order(2)
    @DisplayName("회원가입 중복 이메일 → 400 (IllegalArgumentException)")
    void signup_duplicateEmail_badRequest() throws Exception {
        signupTestUser();

        mockMvc.perform(post("/api/portal/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupJson("test@example.com", "otheruser", "Password123")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("BAD_REQUEST"))
                .andExpect(jsonPath("$.message").value("Email already exists: test@example.com"));
    }

    @Test
    @Order(3)
    @DisplayName("회원가입 유효성 검증 실패 → 400")
    void signup_invalidRequest_badRequest() throws Exception {
        mockMvc.perform(post("/api/portal/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupJson("invalid-email", "ab", "short")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
    }

    @Test
    @Order(4)
    @DisplayName("로그인 성공 → 200 + accessToken + refresh_token 쿠키")
    void login_success() throws Exception {
        signupTestUser();

        // 회원가입에서 생성된 refresh token 삭제 (같은 초에 생성 시 JWT 토큰 중복 방지)
        refreshTokenRepository.deleteAll();
        Thread.sleep(1000);

        MvcResult result = mockMvc.perform(post("/api/portal/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("testuser", "Password123")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andReturn();

        Cookie refreshCookie = result.getResponse().getCookie("refresh_token");
        assertThat(refreshCookie).isNotNull();
    }

    @Test
    @Order(5)
    @DisplayName("로그인 실패 (잘못된 비밀번호) → 400")
    void login_wrongPassword_badRequest() throws Exception {
        signupTestUser();

        mockMvc.perform(post("/api/portal/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginJson("testuser", "WrongPassword1")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    @Order(6)
    @DisplayName("토큰 갱신 성공 → 200 + 새 accessToken + 새 refresh_token 쿠키")
    void refreshToken_success() throws Exception {
        Cookie refreshCookie = signupAndGetRefreshCookie();

        MvcResult result = mockMvc.perform(post("/api/portal/auth/refresh")
                        .cookie(refreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andReturn();

        Cookie newRefreshCookie = result.getResponse().getCookie("refresh_token");
        assertThat(newRefreshCookie).isNotNull();
        assertThat(newRefreshCookie.getValue()).isNotEqualTo(refreshCookie.getValue());
    }

    @Test
    @Order(7)
    @DisplayName("토큰 갱신 (쿠키 없음) → 401")
    void refreshToken_noCookie_unauthorized() throws Exception {
        mockMvc.perform(post("/api/portal/auth/refresh"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(8)
    @DisplayName("로그아웃 성공 → 204 + 쿠키 삭제")
    void logout_success() throws Exception {
        Cookie refreshCookie = signupAndGetRefreshCookie();

        MvcResult result = mockMvc.perform(post("/api/portal/auth/logout")
                        .cookie(refreshCookie))
                .andExpect(status().isNoContent())
                .andReturn();

        Cookie clearedCookie = result.getResponse().getCookie("refresh_token");
        assertThat(clearedCookie).isNotNull();
        assertThat(clearedCookie.getMaxAge()).isZero();
    }

    @Test
    @Order(9)
    @DisplayName("인증된 사용자 정보 조회 → 200")
    void me_authenticated_success() throws Exception {
        String accessToken = signupAndGetAccessToken();

        mockMvc.perform(get("/api/portal/auth/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.authorities").isArray());
    }

    @Test
    @Order(10)
    @DisplayName("미인증 사용자 정보 조회 → 403 (Spring Security 기본)")
    void me_unauthenticated_forbidden() throws Exception {
        mockMvc.perform(get("/api/portal/auth/me"))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(11)
    @DisplayName("로그아웃 후 같은 refresh token으로 갱신 시도 → 400")
    void refreshAfterLogout_fails() throws Exception {
        Cookie refreshCookie = signupAndGetRefreshCookie();

        mockMvc.perform(post("/api/portal/auth/logout")
                        .cookie(refreshCookie))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/api/portal/auth/refresh")
                        .cookie(refreshCookie))
                .andExpect(status().isBadRequest());
    }

    // === Helper Methods ===

    private String signupJson(String email, String username, String password) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "email", email, "username", username, "password", password
        ));
    }

    private String loginJson(String username, String password) throws Exception {
        return objectMapper.writeValueAsString(Map.of(
                "username", username, "password", password
        ));
    }

    private void signupTestUser() throws Exception {
        mockMvc.perform(post("/api/portal/auth/signup")
                .contentType(MediaType.APPLICATION_JSON)
                .content(signupJson("test@example.com", "testuser", "Password123")));
    }

    private Cookie signupAndGetRefreshCookie() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/portal/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupJson("test@example.com", "testuser", "Password123")))
                .andReturn();
        return result.getResponse().getCookie("refresh_token");
    }

    private String signupAndGetAccessToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/portal/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(signupJson("test@example.com", "testuser", "Password123")))
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }
}
