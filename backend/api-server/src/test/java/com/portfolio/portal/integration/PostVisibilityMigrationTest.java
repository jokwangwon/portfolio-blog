package com.portfolio.portal.integration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;

import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PostVisibilityMigrationTest {
    @Test
    void upgradingV1PreservesExistingContentAndStatuses() throws Exception {
        try (var database = new PostgreSQLContainer<>("postgres:15-alpine")) {
            database.start();
            Flyway.configure().dataSource(database.getJdbcUrl(), database.getUsername(), database.getPassword())
                    .target("1").load().migrate();
            try (var connection = DriverManager.getConnection(database.getJdbcUrl(), database.getUsername(), database.getPassword());
                 var statement = connection.createStatement()) {
                statement.executeUpdate("INSERT INTO users (username,email,password) VALUES ('migration','migration@example.com','unused')");
                for (String status : List.of("PUBLISHED", "DRAFT", "ARCHIVED")) {
                    try (var insert = connection.prepareStatement("INSERT INTO posts (author_id,title,slug,content,status) VALUES (1,?,?,?,?)")) {
                        insert.setString(1, status);
                        insert.setString(2, status.toLowerCase());
                        insert.setString(3, "Original content");
                        insert.setString(4, status);
                        insert.executeUpdate();
                    }
                }
                Flyway.configure().dataSource(database.getJdbcUrl(), database.getUsername(), database.getPassword())
                        .load().migrate();
                var statuses = new ArrayList<String>();
                try (var rows = statement.executeQuery("SELECT status, visibility, content FROM posts ORDER BY id")) {
                    while (rows.next()) {
                        statuses.add(rows.getString("status"));
                        assertThat(rows.getString("visibility")).isEqualTo("PUBLIC");
                        assertThat(rows.getString("content")).isEqualTo("Original content");
                    }
                }
                assertThat(statuses).containsExactly("PUBLISHED", "DRAFT", "ARCHIVED");
                statement.executeUpdate("UPDATE posts SET visibility='PRIVATE' WHERE status='PUBLISHED'");
                assertThatThrownBy(() -> statement.executeUpdate("UPDATE posts SET visibility='SECRET'"))
                        .isInstanceOf(SQLException.class);
                Flyway.configure().dataSource(database.getJdbcUrl(), database.getUsername(), database.getPassword())
                        .load().validate();
            }
        }
    }
}
