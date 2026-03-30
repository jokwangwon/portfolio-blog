package com.portfolio.portal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication(
    scanBasePackages = {
        "com.portfolio.portal",
        "com.portfolio.common",
        "com.portfolio.domain",
        "com.portfolio.security",
        "com.portfolio.module.user",
        "com.portfolio.module.blog",
        "com.portfolio.module.benchmark"
    }
)
@EnableJpaRepositories(basePackages = {
    "com.portfolio.domain.user.repository",
    "com.portfolio.domain.blog.repository"
})
@EntityScan(basePackages = {
    "com.portfolio.domain.user",
    "com.portfolio.domain.blog",
    "com.portfolio.domain.common"
})
@EnableJpaAuditing
public class PortfolioPortalApplication {

    public static void main(String[] args) {
        SpringApplication.run(PortfolioPortalApplication.class, args);
    }
}
