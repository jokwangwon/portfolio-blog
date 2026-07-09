package com.portfolio.module.user.service;

import com.portfolio.domain.user.User;
import com.portfolio.domain.user.UserRole;
import com.portfolio.domain.user.repository.UserRepository;
import com.portfolio.module.user.dto.ChangePasswordRequest;
import com.portfolio.module.user.dto.UserProfileResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class UserProfileServiceTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserProfileService userProfileService;

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .email("test@test.com")
                .username("testuser")
                .password("encodedPassword")
                .role(UserRole.USER)
                .build();
        ReflectionTestUtils.setField(user, "id", 1L);
    }

    @Nested
    @DisplayName("getMyProfile")
    class GetMyProfile {

        @Test
        @DisplayName("사용자 프로필을 반환한다")
        void returnsProfile() {
            given(userRepository.findByUsername("testuser")).willReturn(Optional.of(user));

            UserProfileResponse response = userProfileService.getMyProfile("testuser");

            assertThat(response.getId()).isEqualTo(1L);
            assertThat(response.getEmail()).isEqualTo("test@test.com");
            assertThat(response.getUsername()).isEqualTo("testuser");
            assertThat(response.getRole()).isEqualTo("USER");
        }

        @Test
        @DisplayName("존재하지 않는 사용자는 예외를 던진다")
        void throwsWhenUserNotFound() {
            given(userRepository.findByUsername("ghost")).willReturn(Optional.empty());

            assertThatThrownBy(() -> userProfileService.getMyProfile("ghost"))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("User not found");
        }
    }

    @Nested
    @DisplayName("changePassword")
    class ChangePassword {

        @Test
        @DisplayName("현재 비밀번호가 일치하면 새 비밀번호로 변경한다")
        void changesPasswordWhenCurrentMatches() {
            given(userRepository.findByUsername("testuser")).willReturn(Optional.of(user));
            given(passwordEncoder.matches("currentPw1!", "encodedPassword")).willReturn(true);
            given(passwordEncoder.encode("newPassword1!")).willReturn("encodedNewPassword");

            userProfileService.changePassword("testuser",
                    new ChangePasswordRequest("currentPw1!", "newPassword1!"));

            assertThat(user.getPassword()).isEqualTo("encodedNewPassword");
            verify(passwordEncoder).encode("newPassword1!");
        }

        @Test
        @DisplayName("현재 비밀번호가 틀리면 예외를 던진다")
        void throwsWhenCurrentPasswordWrong() {
            given(userRepository.findByUsername("testuser")).willReturn(Optional.of(user));
            given(passwordEncoder.matches("wrongPw", "encodedPassword")).willReturn(false);

            assertThatThrownBy(() -> userProfileService.changePassword("testuser",
                    new ChangePasswordRequest("wrongPw", "newPassword1!")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("Current password does not match");

            assertThat(user.getPassword()).isEqualTo("encodedPassword");
        }

        @Test
        @DisplayName("존재하지 않는 사용자는 예외를 던진다")
        void throwsWhenUserNotFound() {
            given(userRepository.findByUsername("ghost")).willReturn(Optional.empty());

            assertThatThrownBy(() -> userProfileService.changePassword("ghost",
                    new ChangePasswordRequest("currentPw1!", "newPassword1!")))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessageContaining("User not found");
        }
    }
}
