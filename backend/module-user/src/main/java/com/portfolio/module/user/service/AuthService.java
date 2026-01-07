package com.portfolio.module.user.service;

import com.portfolio.domain.user.RefreshToken;
import com.portfolio.domain.user.User;
import com.portfolio.domain.user.UserRole;
import com.portfolio.domain.user.repository.RefreshTokenRepository;
import com.portfolio.domain.user.repository.UserRepository;
import com.portfolio.security.config.JwtProperties;
import com.portfolio.security.dto.AuthResponse;
import com.portfolio.security.dto.LoginRequest;
import com.portfolio.security.dto.SignupRequest;
import com.portfolio.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final AuthenticationManager authenticationManager;
    private final JwtProperties jwtProperties;

    /**
     * 회원가입
     */
    @Transactional
    public AuthResponse signup(SignupRequest request) {
        // 이메일 중복 체크
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already exists: " + request.getEmail());
        }

        // 사용자명 중복 체크
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username already exists: " + request.getUsername());
        }

        // 사용자 생성
        User user = User.builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(UserRole.USER)
                .build();

        userRepository.save(user);

        log.info("User registered successfully: {}", user.getUsername());

        // 자동 로그인
        return authenticateAndCreateTokens(request.getUsername(), request.getPassword());
    }

    /**
     * 로그인
     */
    @Transactional
    public AuthResponse login(LoginRequest request) {
        return authenticateAndCreateTokens(request.getUsername(), request.getPassword());
    }

    /**
     * 토큰 갱신
     */
    @Transactional
    public AuthResponse refreshToken(String refreshTokenValue) {
        // Refresh Token 조회
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        // Refresh Token 유효성 검증
        if (!refreshToken.isValid()) {
            throw new IllegalArgumentException("Refresh token is expired or revoked");
        }

        // Refresh Token Rotation: 기존 토큰 무효화
        refreshToken.revoke();

        // 새로운 토큰 생성
        User user = refreshToken.getUser();
        Authentication authentication = createAuthentication(user);

        String newAccessToken = jwtTokenProvider.generateAccessToken(authentication);
        String newRefreshToken = jwtTokenProvider.generateRefreshToken(authentication);

        // 새로운 Refresh Token 저장 (같은 Family)
        RefreshToken newRefreshTokenEntity = RefreshToken.builder()
                .user(user)
                .token(newRefreshToken)
                .tokenFamily(refreshToken.getTokenFamily())
                .expiresAt(LocalDateTime.now().plusSeconds(jwtProperties.getRefreshExpiration() / 1000))
                .build();

        refreshTokenRepository.save(newRefreshTokenEntity);

        log.info("Token refreshed for user: {}", user.getUsername());

        return new AuthResponse(
                newAccessToken,
                newRefreshToken,
                jwtProperties.getAccessExpiration()
        );
    }

    /**
     * 로그아웃
     */
    @Transactional
    public void logout(String refreshTokenValue) {
        RefreshToken refreshToken = refreshTokenRepository.findByToken(refreshTokenValue)
                .orElseThrow(() -> new IllegalArgumentException("Invalid refresh token"));

        // Refresh Token Family 전체 무효화 (보안 강화)
        refreshTokenRepository.deleteByTokenFamily(refreshToken.getTokenFamily());

        log.info("User logged out: {}", refreshToken.getUser().getUsername());
    }

    /**
     * 인증 및 토큰 생성 (공통 로직)
     */
    private AuthResponse authenticateAndCreateTokens(String username, String password) {
        try {
            // Spring Security 인증
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(username, password)
            );

            // JWT 토큰 생성
            String accessToken = jwtTokenProvider.generateAccessToken(authentication);
            String refreshToken = jwtTokenProvider.generateRefreshToken(authentication);

            // Refresh Token 저장
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> new IllegalArgumentException("User not found"));

            String tokenFamily = UUID.randomUUID().toString();

            RefreshToken refreshTokenEntity = RefreshToken.builder()
                    .user(user)
                    .token(refreshToken)
                    .tokenFamily(tokenFamily)
                    .expiresAt(LocalDateTime.now().plusSeconds(jwtProperties.getRefreshExpiration() / 1000))
                    .build();

            refreshTokenRepository.save(refreshTokenEntity);

            log.info("User authenticated successfully: {}", username);

            return new AuthResponse(
                    accessToken,
                    refreshToken,
                    jwtProperties.getAccessExpiration()
            );

        } catch (AuthenticationException e) {
            log.error("Authentication failed for user: {}", username);
            throw new IllegalArgumentException("Invalid username or password");
        }
    }

    /**
     * Authentication 객체 생성
     */
    private Authentication createAuthentication(User user) {
        return new UsernamePasswordAuthenticationToken(
                user.getUsername(),
                null,
                null
        );
    }
}
