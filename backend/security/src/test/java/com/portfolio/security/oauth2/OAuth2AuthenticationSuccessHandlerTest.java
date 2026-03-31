package com.portfolio.security.oauth2;

import com.portfolio.domain.user.RefreshToken;
import com.portfolio.domain.user.User;
import com.portfolio.domain.user.UserRole;
import com.portfolio.domain.user.repository.RefreshTokenRepository;
import com.portfolio.security.config.JwtProperties;
import com.portfolio.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class OAuth2AuthenticationSuccessHandlerTest {

    @Mock
    private JwtTokenProvider jwtTokenProvider;

    @Mock
    private JwtProperties jwtProperties;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private Authentication authentication;

    @InjectMocks
    private OAuth2AuthenticationSuccessHandler handler;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .email("test@gmail.com")
                .username("testuser")
                .password("encoded")
                .role(UserRole.USER)
                .build();

        ReflectionTestUtils.setField(handler, "frontendUrl", "http://localhost:3000");
    }

    @Test
    @DisplayName("OAuth2 인증 성공 시 JWT 토큰을 생성하고 프론트엔드로 리다이렉트한다")
    void shouldGenerateTokensAndRedirect() throws Exception {
        // given
        OAuth2UserPrincipal principal = new OAuth2UserPrincipal(testUser, Map.of());
        given(authentication.getPrincipal()).willReturn(principal);
        given(jwtTokenProvider.generateAccessToken(any())).willReturn("access-token-123");
        given(jwtTokenProvider.generateRefreshToken(any())).willReturn("refresh-token-456");
        given(jwtProperties.getRefreshExpiration()).willReturn(604800000L);

        // when
        handler.onAuthenticationSuccess(request, response, authentication);

        // then
        // Verify refresh token saved
        ArgumentCaptor<RefreshToken> tokenCaptor = ArgumentCaptor.forClass(RefreshToken.class);
        verify(refreshTokenRepository).save(tokenCaptor.capture());
        RefreshToken savedToken = tokenCaptor.getValue();
        assertThat(savedToken.getToken()).isEqualTo("refresh-token-456");
        assertThat(savedToken.getUser()).isEqualTo(testUser);

        // Verify refresh token cookie
        ArgumentCaptor<Cookie> cookieCaptor = ArgumentCaptor.forClass(Cookie.class);
        verify(response).addCookie(cookieCaptor.capture());
        Cookie cookie = cookieCaptor.getValue();
        assertThat(cookie.getName()).isEqualTo("refresh_token");
        assertThat(cookie.getValue()).isEqualTo("refresh-token-456");
        assertThat(cookie.isHttpOnly()).isTrue();

        // Verify redirect to frontend with access token
        ArgumentCaptor<String> redirectCaptor = ArgumentCaptor.forClass(String.class);
        verify(response).sendRedirect(redirectCaptor.capture());
        String redirectUrl = redirectCaptor.getValue();
        assertThat(redirectUrl).startsWith("http://localhost:3000/auth/callback");
        assertThat(redirectUrl).contains("accessToken=access-token-123");
    }
}
