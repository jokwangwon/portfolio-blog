package com.portfolio.security.oauth2;

import com.portfolio.domain.user.RefreshToken;
import com.portfolio.domain.user.User;
import com.portfolio.domain.user.repository.RefreshTokenRepository;
import com.portfolio.security.config.JwtProperties;
import com.portfolio.security.jwt.JwtTokenProvider;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class OAuth2AuthenticationSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final JwtProperties jwtProperties;
    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) throws IOException {
        OAuth2UserPrincipal principal = (OAuth2UserPrincipal) authentication.getPrincipal();
        User user = principal.getUser();

        // JWT 토큰 생성
        String accessToken = jwtTokenProvider.generateAccessToken(authentication);
        String refreshToken = jwtTokenProvider.generateRefreshToken(authentication);

        // Refresh Token 저장
        String tokenFamily = UUID.randomUUID().toString();
        RefreshToken refreshTokenEntity = RefreshToken.builder()
                .user(user)
                .token(refreshToken)
                .tokenFamily(tokenFamily)
                .expiresAt(LocalDateTime.now().plusSeconds(jwtProperties.getRefreshExpiration() / 1000))
                .build();
        refreshTokenRepository.save(refreshTokenEntity);

        // Refresh Token을 HttpOnly Cookie로 설정
        Cookie cookie = new Cookie("refresh_token", refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(false); // dev: false, prod: true
        cookie.setPath("/api/portal/auth");
        cookie.setMaxAge((int) (jwtProperties.getRefreshExpiration() / 1000));
        response.addCookie(cookie);

        // 프론트엔드 콜백 URL로 리다이렉트 (access token은 URL param으로)
        String redirectUrl = frontendUrl + "/auth/callback?accessToken="
                + URLEncoder.encode(accessToken, StandardCharsets.UTF_8);

        log.info("OAuth2 login successful for user: {}", user.getUsername());
        response.sendRedirect(redirectUrl);
    }
}
