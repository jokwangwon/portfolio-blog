package com.portfolio.blog;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(
    scanBasePackages = {
        "com.portfolio.blog",
        "com.portfolio.common",
        "com.portfolio.domain",
        "com.portfolio.security",
        "com.portfolio.module.user",
        "com.portfolio.module.blog",
        "com.portfolio.module.benchmark"
    }
)
public class PortfolioBlogApplication {

    public static void main(String[] args) {
        SpringApplication.run(PortfolioBlogApplication.class, args);
    }
}
