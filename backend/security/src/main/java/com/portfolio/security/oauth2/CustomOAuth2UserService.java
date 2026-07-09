package com.portfolio.security.oauth2;

import com.portfolio.domain.user.OAuthAccount;
import com.portfolio.domain.user.OAuthProvider;
import com.portfolio.domain.user.User;
import com.portfolio.domain.user.UserRole;
import com.portfolio.domain.user.repository.OAuthAccountRepository;
import com.portfolio.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final OAuthAccountRepository oAuthAccountRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);

        String registrationId = userRequest.getClientRegistration().getRegistrationId();
        OAuthProvider provider = OAuthProvider.valueOf(registrationId.toUpperCase());

        Map<String, Object> attributes = oAuth2User.getAttributes();
        String providerId = extractProviderId(provider, attributes);
        String email = extractEmail(provider, attributes);
        String name = extractName(provider, attributes);

        // GitHub 등에서 이메일이 비공개인 경우 fallback 이메일 생성
        if (email == null || email.isBlank()) {
            email = provider.name().toLowerCase() + "_" + providerId + "@oauth.placeholder";
            log.warn("OAuth email not available for provider={}, using placeholder: {}", provider, email);
        }

        User user = processOAuthUser(provider, providerId, email, name);

        return new OAuth2UserPrincipal(user, attributes);
    }

    @Transactional
    public User processOAuthUser(OAuthProvider provider, String providerId, String email, String name) {
        // 1. 기존 OAuth 계정이 있으면 바로 반환
        return oAuthAccountRepository.findByProviderAndProviderId(provider, providerId)
                .map(OAuthAccount::getUser)
                .orElseGet(() -> {
                    // 2. 이메일로 기존 사용자 찾기
                    User user = userRepository.findByEmail(email)
                            .orElseGet(() -> createNewUser(email, name));

                    // 3. OAuth 계정 연결
                    OAuthAccount oAuthAccount = OAuthAccount.builder()
                            .user(user)
                            .provider(provider)
                            .providerId(providerId)
                            .email(email)
                            .build();
                    oAuthAccountRepository.save(oAuthAccount);

                    log.info("OAuth account linked: provider={}, user={}", provider, user.getUsername());
                    return user;
                });
    }

    private User createNewUser(String email, String name) {
        String username = generateUniqueUsername(name);
        String randomPassword = passwordEncoder.encode(UUID.randomUUID().toString());

        User user = User.builder()
                .email(email)
                .username(username)
                .password(randomPassword)
                .role(UserRole.USER)
                .build();

        return userRepository.save(user);
    }

    private String generateUniqueUsername(String name) {
        if (!userRepository.existsByUsername(name)) {
            return name;
        }
        return name + "_" + UUID.randomUUID().toString().substring(0, 8);
    }

    private String extractProviderId(OAuthProvider provider, Map<String, Object> attributes) {
        return switch (provider) {
            case GOOGLE -> (String) attributes.get("sub");
            case GITHUB -> String.valueOf(attributes.get("id"));
            case KAKAO -> String.valueOf(attributes.get("id"));
        };
    }

    private String extractEmail(OAuthProvider provider, Map<String, Object> attributes) {
        return switch (provider) {
            case GOOGLE -> (String) attributes.get("email");
            case GITHUB -> (String) attributes.get("email");
            case KAKAO -> {
                @SuppressWarnings("unchecked")
                Map<String, Object> kakaoAccount = (Map<String, Object>) attributes.get("kakao_account");
                yield kakaoAccount != null ? (String) kakaoAccount.get("email") : null;
            }
        };
    }

    private String extractName(OAuthProvider provider, Map<String, Object> attributes) {
        return switch (provider) {
            case GOOGLE -> (String) attributes.get("name");
            case GITHUB -> (String) attributes.get("login");
            case KAKAO -> {
                @SuppressWarnings("unchecked")
                Map<String, Object> properties = (Map<String, Object>) attributes.get("properties");
                yield properties != null ? (String) properties.get("nickname") : "user";
            }
        };
    }
}
