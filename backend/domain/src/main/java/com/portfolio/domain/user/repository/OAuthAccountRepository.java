package com.portfolio.domain.user.repository;

import com.portfolio.domain.user.OAuthAccount;
import com.portfolio.domain.user.OAuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, Long> {

    Optional<OAuthAccount> findByProviderAndProviderId(OAuthProvider provider, String providerId);

    boolean existsByProviderAndProviderId(OAuthProvider provider, String providerId);
}
