package com.portfolio.domain.user.repository;

import com.portfolio.domain.user.RefreshToken;
import com.portfolio.domain.user.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    Optional<RefreshToken> findByToken(String token);

    Optional<RefreshToken> findByTokenFamily(String tokenFamily);

    void deleteByUser(User user);

    void deleteByTokenFamily(String tokenFamily);
}
