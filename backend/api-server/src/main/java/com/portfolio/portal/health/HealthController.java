package com.portfolio.portal.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
public class HealthController {

    @GetMapping("/health")
    public Map<String, Object> health() {
        return Map.of(
                "status", "UP",
                "service", "portfolio-portal-api",
                "timestamp", LocalDateTime.now().toString()
        );
    }

    @GetMapping("/api/summary")
    public Map<String, Object> summary() {
        return Map.of(
                "service", "portfolio-portal-api",
                "version", "0.1.0",
                "description", "Portfolio Portal API - Blog, Auth, Service Registry",
                "endpoints", List.of(
                        Map.of("path", "/api/portal/auth/**", "description", "Authentication"),
                        Map.of("path", "/api/portal/posts/**", "description", "Blog Posts"),
                        Map.of("path", "/api/portal/categories/**", "description", "Categories"),
                        Map.of("path", "/api/portal/tags/**", "description", "Tags"),
                        Map.of("path", "/api/portal/comments/**", "description", "Comments")
                )
        );
    }
}
