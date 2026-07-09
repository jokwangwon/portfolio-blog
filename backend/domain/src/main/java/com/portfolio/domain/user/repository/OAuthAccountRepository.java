package com.portfolio.domain.user.repository;

import com.portfolio.domain.user.OAuthAccount;
import com.portfolio.domain.user.OAuthProvider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface OAuthAccountRepository extends JpaRepository<OAuthAccount, Long> {

    @Query("SELECT oa FROM OAuthAccount oa JOIN FETCH oa.user WHERE oa.provider = :provider AND oa.providerId = :providerId")
    Optional<OAuthAccount> findByProviderAndProviderId(@Param("provider") OAuthProvider provider, @Param("providerId") String providerId);

    boolean existsByProviderAndProviderId(OAuthProvider provider, String providerId);
}
