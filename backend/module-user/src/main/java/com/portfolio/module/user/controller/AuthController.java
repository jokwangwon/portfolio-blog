package com.portfolio.module.user.controller;

import com.portfolio.module.user.service.AuthService;
import com.portfolio.security.config.JwtProperties;
import com.portfolio.security.dto.AuthResponse;
import com.portfolio.security.dto.LoginRequest;
import com.portfolio.security.dto.SignupRequest;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/portal/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String REFRESH_TOKEN_COOKIE = "refresh_token";

    private final AuthService authService;
    private final JwtProperties jwtProperties;

    @Value("${app.cookie-secure:false}")
    private boolean cookieSecure;

    @PostMapping("/signup")
    public ResponseEntity<Map<String, Object>> signup(
            @Valid @RequestBody SignupRequest request,
            HttpServletResponse response) {
        log.info("Signup request for username: {}", request.getUsername());
        AuthResponse authResponse = authService.signup(request);
        addRefreshTokenCookie(response, authResponse.getRefreshToken());
        return ResponseEntity.status(HttpStatus.CREATED).body(accessTokenBody(authResponse));
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletResponse response) {
        log.info("Login request for username: {}", request.getUsername());
        AuthResponse authResponse = authService.login(request);
        addRefreshTokenCookie(response, authResponse.getRefreshToken());
        return ResponseEntity.ok(accessTokenBody(authResponse));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Map<String, Object>> refreshToken(
            HttpServletRequest request,
            HttpServletResponse response) {
        String refreshToken = extractRefreshTokenFromCookie(request);
        if (refreshToken == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("code", "AUTH_TOKEN_EXPIRED", "message", "Refresh token not found"));
        }
        log.info("Token refresh request");
        AuthResponse authResponse = authService.refreshToken(refreshToken);
        addRefreshTokenCookie(response, authResponse.getRefreshToken());
        return ResponseEntity.ok(accessTokenBody(authResponse));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            HttpServletRequest request,
            HttpServletResponse response) {
        String refreshToken = extractRefreshTokenFromCookie(request);
        if (refreshToken != null) {
            authService.logout(refreshToken);
        }
        clearRefreshTokenCookie(response);
        log.info("Logout request");
        return ResponseEntity.noContent().build();
    }

    /**
     * OAuth2 소셜 로그인 후 refresh token 쿠키 설정.
     * OAuth2 콜백은 백엔드에서 프론트엔드로 redirect하므로 쿠키가 백엔드 도메인에 설정됨.
     * 프론트엔드는 이 엔드포인트를 Next.js 프록시를 경유하여 호출해 쿠키를 프론트 도메인에 설정.
     */
    @PostMapping("/oauth-session")
    public ResponseEntity<Map<String, Object>> setOAuthSession(
            @RequestBody Map<String, String> body,
            HttpServletResponse response) {
        String refreshToken = body.get("refreshToken");
        if (refreshToken == null || refreshToken.isBlank()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "refreshToken is required"));
        }
        addRefreshTokenCookie(response, refreshToken);
        return ResponseEntity.ok(Map.of("message", "session established"));
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser(@AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(Map.of(
                "username", userDetails.getUsername(),
                "authorities", userDetails.getAuthorities().stream()
                        .map(Object::toString).toList()
        ));
    }

    private Map<String, Object> accessTokenBody(AuthResponse authResponse) {
        return Map.of(
                "accessToken", authResponse.getAccessToken(),
                "tokenType", "Bearer",
                "expiresIn", authResponse.getExpiresIn()
        );
    }

    private void addRefreshTokenCookie(HttpServletResponse response, String refreshToken) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, refreshToken);
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/api/portal/auth");
        cookie.setMaxAge((int) (jwtProperties.getRefreshExpiration() / 1000));
        response.addCookie(cookie);
    }

    private void clearRefreshTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(REFRESH_TOKEN_COOKIE, "");
        cookie.setHttpOnly(true);
        cookie.setSecure(cookieSecure);
        cookie.setPath("/api/portal/auth");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    private String extractRefreshTokenFromCookie(HttpServletRequest request) {
        if (request.getCookies() == null) return null;
        return Arrays.stream(request.getCookies())
                .filter(c -> REFRESH_TOKEN_COOKIE.equals(c.getName()))
                .map(Cookie::getValue)
                .findFirst()
                .orElse(null);
    }
}
