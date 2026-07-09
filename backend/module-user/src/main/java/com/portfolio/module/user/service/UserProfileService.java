package com.portfolio.module.user.service;

import com.portfolio.domain.user.User;
import com.portfolio.domain.user.repository.UserRepository;
import com.portfolio.module.user.dto.ChangePasswordRequest;
import com.portfolio.module.user.dto.UserProfileResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserProfileResponse getMyProfile(String username) {
        return UserProfileResponse.from(findUser(username));
    }

    @Transactional
    public void changePassword(String username, ChangePasswordRequest request) {
        User user = findUser(username);

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Current password does not match");
        }

        user.updatePassword(passwordEncoder.encode(request.getNewPassword()));
        log.info("Password changed for user: {}", username);
    }

    private User findUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));
    }
}
