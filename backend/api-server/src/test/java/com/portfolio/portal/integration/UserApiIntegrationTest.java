package com.portfolio.portal.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("User Profile API 통합 테스트")
class UserApiIntegrationTest extends IntegrationTestBase {

    @Autowired
    private ObjectMapper objectMapper;

    private String accessToken;

    @BeforeEach
    void setUpUser() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/portal/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "email", "profile@example.com",
                                "username", "profileuser",
                                "password", "OldPass123!"))))
                .andReturn();

        accessToken = objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    @Test
    @DisplayName("내 프로필 조회 (미인증) → 401")
    void getMyProfile_unauthenticated_401() throws Exception {
        mockMvc.perform(get("/api/portal/users/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("내 프로필 조회 (인증) → 200 + id/email/username/role/createdAt")
    void getMyProfile_authenticated_200() throws Exception {
        mockMvc.perform(get("/api/portal/users/me")
                        .header("Authorization", "Bearer " + accessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.email").value("profile@example.com"))
                .andExpect(jsonPath("$.username").value("profileuser"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.createdAt").exists());
    }

    @Test
    @DisplayName("비밀번호 변경 성공 → 204, 새 비밀번호로 로그인 가능")
    void changePassword_success_204_andLoginWithNewPassword() throws Exception {
        mockMvc.perform(put("/api/portal/users/me/password")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "currentPassword", "OldPass123!",
                                "newPassword", "NewPass456!"))))
                .andExpect(status().isNoContent());

        // 새 비밀번호로 로그인 성공
        mockMvc.perform(post("/api/portal/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "profileuser", "password", "NewPass456!"))))
                .andExpect(status().isOk());

        // 이전 비밀번호로는 로그인 실패
        mockMvc.perform(post("/api/portal/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "username", "profileuser", "password", "OldPass123!"))))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("비밀번호 변경 (현재 비밀번호 불일치) → 400")
    void changePassword_wrongCurrent_400() throws Exception {
        mockMvc.perform(put("/api/portal/users/me/password")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "currentPassword", "WrongPass999!",
                                "newPassword", "NewPass456!"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("비밀번호 변경 (새 비밀번호 8자 미만) → 400")
    void changePassword_invalidNewPassword_400() throws Exception {
        mockMvc.perform(put("/api/portal/users/me/password")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "currentPassword", "OldPass123!",
                                "newPassword", "short"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("비밀번호 변경 (미인증) → 401")
    void changePassword_unauthenticated_401() throws Exception {
        mockMvc.perform(put("/api/portal/users/me/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "currentPassword", "OldPass123!",
                                "newPassword", "NewPass456!"))))
                .andExpect(status().isUnauthorized());
    }
}
