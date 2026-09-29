package com.portfolio.portal.health;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.SQLException;
import org.springframework.http.ResponseEntity;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
public class HealthController {

    private final DataSource dataSource;

    public HealthController(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        boolean healthy;
        try (Connection connection = dataSource.getConnection()) {
            healthy = connection.isValid(2);
        } catch (SQLException e) {
            healthy = false;
        }
        return ResponseEntity.status(healthy ? 200 : 503).body(Map.of(
                "status", healthy ? "UP" : "DOWN",
                "service", "portfolio-portal-api",
                "timestamp", LocalDateTime.now().toString()
        ));
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
