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
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RefreshTokenRepository refreshTokenRepository;
    @Mock
    private PasswordEncoder passwordEncoder;
    @Mock
    private JwtTokenProvider jwtTokenProvider;
    @Mock
    private AuthenticationManager authenticationManager;
    @Mock
    private JwtProperties jwtProperties;

    @InjectMocks
    private AuthService authService;

    private User user;
    private Authentication authentication;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .email("test@test.com")
                .username("testuser")
                .password("encodedPassword")
                .role(UserRole.USER)
                .build();
        ReflectionTestUtils.setField(user, "id", 1L);

        authentication = new UsernamePasswordAuthenticationToken(
                "testuser", null, Collections.emptyList());
    }

    @Nested
    @DisplayName("signup")
    class Signup {

        @Test
        @DisplayName("새 사용자를 등록하고 토큰을 반환한다")
        void registerAndReturnTokens() {
            SignupRequest request = new SignupRequest("test@test.com", "testuser", "password123");

            given(userRepository.existsByEmail("test@test.com")).willReturn(false);
            given(userRepository.existsByUsername("testuser")).willReturn(false);
            given(passwordEncoder.encode("password123")).willReturn("encodedPassword");
            given(userRepository.save(any(User.class))).willReturn(user);
            given(authenticationManager.authenticate(any())).willReturn(authentication);
            given(jwtTokenProvider.generateAccessToken(any())).willReturn("access-token");
            given(jwtTokenProvider.generateRefreshToken(any())).willReturn("refresh-token");
            given(userRepository.findByUsername("testuser")).willReturn(Optional.of(user));
            given(jwtProperties.getRefreshExpiration()).willReturn(604800000L);
            given(jwtProperties.getAccessExpiration()).willReturn(900000L);

            AuthResponse result = authService.signup(request);

            assertThat(result.getAccessToken()).isEqualTo("access-token");
            assertThat(result.getRefreshToken()).isEqualTo("refresh-token");
            assertThat(result.getExpiresIn()).isEqualTo(900000L);
            verify(userRepository).save(any(User.class));
            verify(refreshTokenRepository).save(any(RefreshToken.class));
        }

        @Test
        @DisplayName("중복 이메일로 가입 시 예외를 던진다")
        void throwWhenDuplicateEmail() {
            SignupRequest request = new SignupRequest("dup@test.com", "newuser", "password123");
            given(userRepository.existsByEmail("dup@test.com")).willReturn(true);

            assertThatThrownBy(() -> authService.signup(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Email already exists");
        }

        @Test
        @DisplayName("중복 사용자명으로 가입 시 예외를 던진다")
        void throwWhenDuplicateUsername() {
            SignupRequest request = new SignupRequest("new@test.com", "testuser", "password123");
            given(userRepository.existsByEmail("new@test.com")).willReturn(false);
            given(userRepository.existsByUsername("testuser")).willReturn(true);

            assertThatThrownBy(() -> authService.signup(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Username already exists");
        }
    }

    @Nested
    @DisplayName("login")
    class Login {

        @Test
        @DisplayName("올바른 자격증명으로 로그인하면 토큰을 반환한다")
        void returnTokensOnValidCredentials() {
            LoginRequest request = new LoginRequest("testuser", "password123");

            given(authenticationManager.authenticate(any())).willReturn(authentication);
            given(jwtTokenProvider.generateAccessToken(any())).willReturn("access-token");
            given(jwtTokenProvider.generateRefreshToken(any())).willReturn("refresh-token");
            given(userRepository.findByUsername("testuser")).willReturn(Optional.of(user));
            given(jwtProperties.getRefreshExpiration()).willReturn(604800000L);
            given(jwtProperties.getAccessExpiration()).willReturn(900000L);

            AuthResponse result = authService.login(request);

            assertThat(result.getAccessToken()).isEqualTo("access-token");
            verify(refreshTokenRepository).save(any(RefreshToken.class));
        }

        @Test
        @DisplayName("잘못된 자격증명으로 로그인 시 예외를 던진다")
        void throwOnInvalidCredentials() {
            LoginRequest request = new LoginRequest("testuser", "wrong");

            given(authenticationManager.authenticate(any()))
                    .willThrow(new BadCredentialsException("Bad credentials"));

            assertThatThrownBy(() -> authService.login(request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid username or password");
        }
    }

    @Nested
    @DisplayName("refreshToken")
    class RefreshTokenTest {

        @Test
        @DisplayName("유효한 리프레시 토큰으로 새 토큰을 발급한다")
        void issueNewTokens() {
            RefreshToken refreshToken = RefreshToken.builder()
                    .user(user)
                    .token("old-refresh-token")
                    .tokenFamily("family-1")
                    .expiresAt(LocalDateTime.now().plusDays(7))
                    .build();

            given(refreshTokenRepository.findByToken("old-refresh-token"))
                    .willReturn(Optional.of(refreshToken));
            given(jwtTokenProvider.generateAccessToken(any())).willReturn("new-access");
            given(jwtTokenProvider.generateRefreshToken(any())).willReturn("new-refresh");
            given(jwtProperties.getRefreshExpiration()).willReturn(604800000L);
            given(jwtProperties.getAccessExpiration()).willReturn(900000L);

            AuthResponse result = authService.refreshToken("old-refresh-token");

            assertThat(result.getAccessToken()).isEqualTo("new-access");
            assertThat(result.getRefreshToken()).isEqualTo("new-refresh");
            assertThat(refreshToken.getRevoked()).isTrue(); // 기존 토큰 무효화
            verify(refreshTokenRepository).save(any(RefreshToken.class));
        }

        @Test
        @DisplayName("존재하지 않는 리프레시 토큰 시 예외를 던진다")
        void throwWhenTokenNotFound() {
            given(refreshTokenRepository.findByToken(anyString())).willReturn(Optional.empty());

            assertThatThrownBy(() -> authService.refreshToken("invalid"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Invalid refresh token");
        }

        @Test
        @DisplayName("만료된 리프레시 토큰 시 예외를 던진다")
        void throwWhenTokenExpired() {
            RefreshToken expiredToken = RefreshToken.builder()
                    .user(user)
                    .token("expired-token")
                    .tokenFamily("family-2")
                    .expiresAt(LocalDateTime.now().minusDays(1))
                    .build();

            given(refreshTokenRepository.findByToken("expired-token"))
                    .willReturn(Optional.of(expiredToken));

            assertThatThrownBy(() -> authService.refreshToken("expired-token"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("expired or revoked");
        }

        @Test
        @DisplayName("무효화된 리프레시 토큰 시 예외를 던진다")
        void throwWhenTokenRevoked() {
            RefreshToken revokedToken = RefreshToken.builder()
                    .user(user)
                    .token("revoked-token")
                    .tokenFamily("family-3")
                    .expiresAt(LocalDateTime.now().plusDays(7))
                    .build();
            revokedToken.revoke();

            given(refreshTokenRepository.findByToken("revoked-token"))
                    .willReturn(Optional.of(revokedToken));

            assertThatThrownBy(() -> authService.refreshToken("revoked-token"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("expired or revoked");
        }
    }

    @Nested
    @DisplayName("logout")
    class Logout {

        @Test
        @DisplayName("로그아웃 시 토큰 패밀리 전체를 삭제한다")
        void deleteTokenFamily() {
            RefreshToken refreshToken = RefreshToken.builder()
                    .user(user)
                    .token("logout-token")
                    .tokenFamily("family-4")
                    .expiresAt(LocalDateTime.now().plusDays(7))
                    .build();

            given(refreshTokenRepository.findByToken("logout-token"))
                    .willReturn(Optional.of(refreshToken));

            authService.logout("logout-token");

            verify(refreshTokenRepository).deleteByTokenFamily("family-4");
        }

        @Test
        @DisplayName("존재하지 않는 토큰으로 로그아웃 시 예외를 던진다")
        void throwWhenTokenNotFound() {
            given(refreshTokenRepository.findByToken(anyString())).willReturn(Optional.empty());

            assertThatThrownBy(() -> authService.logout("invalid"))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }
}
