package com.portfolio.portal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.domain.EntityScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(
    scanBasePackages = {
        "com.portfolio.portal",
        "com.portfolio.common",
        "com.portfolio.domain",
        "com.portfolio.security",
        "com.portfolio.module.user",
        "com.portfolio.module.blog",
        "com.portfolio.module.registry",
        "com.portfolio.module.ai",
        "com.portfolio.module.benchmark"
    }
)
@EnableScheduling
@EnableJpaRepositories(basePackages = {
    "com.portfolio.domain.user.repository",
    "com.portfolio.domain.blog.repository",
    "com.portfolio.domain.service.repository",
    "com.portfolio.domain.benchmark.repository"
})
@EntityScan(basePackages = {
    "com.portfolio.domain.user",
    "com.portfolio.domain.blog",
    "com.portfolio.domain.service",
    "com.portfolio.domain.common",
    "com.portfolio.domain.benchmark"
})
@EnableJpaAuditing
public class PortfolioPortalApplication {

    public static void main(String[] args) {
        SpringApplication.run(PortfolioPortalApplication.class, args);
    }
}
