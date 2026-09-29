package com.portfolio.portal.integration;

import com.portfolio.domain.user.User;
import com.portfolio.domain.user.UserRole;
import com.portfolio.domain.user.repository.UserRepository;
import com.portfolio.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.TestPropertySource;
import java.util.List;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@TestPropertySource(properties = "app.public-read-only=true")
class PublicReadOnlyIntegrationTest extends IntegrationTestBase {
    @Autowired UserRepository users;
    @Autowired JwtTokenProvider tokens;

    private String token(String username, UserRole role) {
        users.save(User.builder().username(username).email(username + "@example.com")
                .password("unused").role(role).build());
        return tokens.generateAccessToken(new UsernamePasswordAuthenticationToken(username, null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role.name()))));
    }

    @Test
    void visitorsCanReadButCannotRegisterOrStartOAuth() throws Exception {
        mockMvc.perform(get("/api/portal/posts")).andExpect(status().isOk());
        mockMvc.perform(post("/api/portal/auth/signup").contentType("application/json")
                .content("{}" )).andExpect(status().is4xxClientError());
        mockMvc.perform(get("/oauth2/authorize/google")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/oauth2/callback/google").param("code", "untrusted"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/portal/auth/login").contentType("application/json")
                .content("{}" )).andExpect(status().isBadRequest());
    }

    @Test
    void existingMembersCannotWriteButAdminsCanPublish() throws Exception {
        String member = token("member", UserRole.USER);
        String admin = token("editor", UserRole.ADMIN);
        mockMvc.perform(post("/api/portal/auth/signup").header("Authorization", "Bearer " + admin)
                .contentType("application/json").content("{}" )).andExpect(status().isForbidden());
        String post = "{\"title\":\"Release post\",\"content\":\"Body\",\"status\":\"PUBLISHED\"}";
        mockMvc.perform(post("/api/portal/posts").header("Authorization", "Bearer " + member)
                .contentType("application/json").content(post)).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/portal/categories").header("Authorization", "Bearer " + member)
                .contentType("application/json").content("{\"name\":\"No\"}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/portal/ai/generate-draft").header("Authorization", "Bearer " + member)
                .contentType("application/json").content("{}" )).andExpect(status().isForbidden());
        mockMvc.perform(post("/api/portal/posts").header("Authorization", "Bearer " + admin)
                .contentType("application/json").content(post)).andExpect(status().isCreated());
        mockMvc.perform(post("/api/portal/posts/1/like").header("Authorization", "Bearer " + admin))
                .andExpect(status().isForbidden());
        mockMvc.perform(post("/api/portal/posts/1/comments").header("Authorization", "Bearer " + member)
                .contentType("application/json").content("{}" )).andExpect(status().isForbidden());
    }
}
