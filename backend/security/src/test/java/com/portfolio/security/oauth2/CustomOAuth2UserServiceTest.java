package com.portfolio.security.oauth2;

import com.portfolio.domain.user.OAuthAccount;
import com.portfolio.domain.user.OAuthProvider;
import com.portfolio.domain.user.User;
import com.portfolio.domain.user.UserRole;
import com.portfolio.domain.user.repository.OAuthAccountRepository;
import com.portfolio.domain.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.user.DefaultOAuth2User;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.time.Instant;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CustomOAuth2UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private OAuthAccountRepository oAuthAccountRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private DefaultOAuth2UserService delegate;

    @InjectMocks
    private CustomOAuth2UserService customOAuth2UserService;

    private User existingUser;

    @BeforeEach
    void setUp() {
        existingUser = User.builder()
                .email("test@gmail.com")
                .username("testuser")
                .password("encoded-password")
                .role(UserRole.USER)
                .build();
    }

    @Nested
    @DisplayName("processOAuthUser")
    class ProcessOAuthUser {

        @Test
        @DisplayName("기존 OAuth 계정이 있으면 해당 사용자를 반환한다")
        void shouldReturnExistingUserWhenOAuthAccountExists() {
            // given
            OAuthAccount existingAccount = OAuthAccount.builder()
                    .user(existingUser)
                    .provider(OAuthProvider.GOOGLE)
                    .providerId("google-123")
                    .email("test@gmail.com")
                    .build();
            given(oAuthAccountRepository.findByProviderAndProviderId(OAuthProvider.GOOGLE, "google-123"))
                    .willReturn(Optional.of(existingAccount));

            // when
            User result = customOAuth2UserService.processOAuthUser(
                    OAuthProvider.GOOGLE, "google-123", "test@gmail.com", "testuser"
            );

            // then
            assertThat(result).isEqualTo(existingUser);
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("같은 이메일의 기존 사용자가 있으면 OAuth 계정을 연결한다")
        void shouldLinkOAuthAccountToExistingUser() {
            // given
            given(oAuthAccountRepository.findByProviderAndProviderId(OAuthProvider.GOOGLE, "google-456"))
                    .willReturn(Optional.empty());
            given(userRepository.findByEmail("test@gmail.com"))
                    .willReturn(Optional.of(existingUser));

            // when
            User result = customOAuth2UserService.processOAuthUser(
                    OAuthProvider.GOOGLE, "google-456", "test@gmail.com", "testuser"
            );

            // then
            assertThat(result).isEqualTo(existingUser);
            ArgumentCaptor<OAuthAccount> captor = ArgumentCaptor.forClass(OAuthAccount.class);
            verify(oAuthAccountRepository).save(captor.capture());
            OAuthAccount saved = captor.getValue();
            assertThat(saved.getProvider()).isEqualTo(OAuthProvider.GOOGLE);
            assertThat(saved.getProviderId()).isEqualTo("google-456");
            assertThat(saved.getUser()).isEqualTo(existingUser);
        }

        @Test
        @DisplayName("새 사용자를 생성하고 OAuth 계정을 생성한다")
        void shouldCreateNewUserAndOAuthAccount() {
            // given
            given(oAuthAccountRepository.findByProviderAndProviderId(OAuthProvider.GITHUB, "github-789"))
                    .willReturn(Optional.empty());
            given(userRepository.findByEmail("new@github.com"))
                    .willReturn(Optional.empty());
            given(userRepository.existsByUsername("newuser"))
                    .willReturn(false);
            given(passwordEncoder.encode(any()))
                    .willReturn("encoded-random-password");
            given(userRepository.save(any(User.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            // when
            User result = customOAuth2UserService.processOAuthUser(
                    OAuthProvider.GITHUB, "github-789", "new@github.com", "newuser"
            );

            // then
            assertThat(result.getEmail()).isEqualTo("new@github.com");
            assertThat(result.getUsername()).isEqualTo("newuser");
            verify(userRepository).save(any(User.class));
            verify(oAuthAccountRepository).save(any(OAuthAccount.class));
        }

        @Test
        @DisplayName("username이 중복이면 suffix를 붙여 생성한다")
        void shouldAppendSuffixWhenUsernameExists() {
            // given
            given(oAuthAccountRepository.findByProviderAndProviderId(OAuthProvider.GOOGLE, "google-dup"))
                    .willReturn(Optional.empty());
            given(userRepository.findByEmail("dup@gmail.com"))
                    .willReturn(Optional.empty());
            given(userRepository.existsByUsername(anyString()))
                    .willAnswer(inv -> "dupuser".equals(inv.getArgument(0)));
            given(passwordEncoder.encode(any()))
                    .willReturn("encoded-random-password");
            given(userRepository.save(any(User.class)))
                    .willAnswer(inv -> inv.getArgument(0));

            // when
            User result = customOAuth2UserService.processOAuthUser(
                    OAuthProvider.GOOGLE, "google-dup", "dup@gmail.com", "dupuser"
            );

            // then
            assertThat(result.getUsername()).startsWith("dupuser_");
            verify(userRepository).save(any(User.class));
        }
    }
}
