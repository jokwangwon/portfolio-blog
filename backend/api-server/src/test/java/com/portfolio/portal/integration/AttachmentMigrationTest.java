package com.portfolio.portal.integration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.PostgreSQLContainer;

import java.sql.DriverManager;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AttachmentMigrationTest {
    @Test
    void upgradingV2PreservesExistingPrivacyUrlsAndEmbeddedImages() throws Exception {
        try (var database = new PostgreSQLContainer<>("postgres:15-alpine")) {
            database.start();
            Flyway.configure().dataSource(database.getJdbcUrl(), database.getUsername(), database.getPassword())
                    .target("2").load().migrate();
            String originalContent = "# Original study\n\n![legacy](data:image/png;base64,original-content)";
            try (var connection = DriverManager.getConnection(database.getJdbcUrl(), database.getUsername(), database.getPassword());
                 var statement = connection.createStatement()) {
                statement.executeUpdate("INSERT INTO users (username,email,password) VALUES ('migration','migration@example.com','unused')");
                List<String> expectedStates = List.of("PUBLISHED:PUBLIC", "PUBLISHED:PRIVATE", "DRAFT:PRIVATE");
                for (int index = 0; index < expectedStates.size(); index++) {
                    String[] state = expectedStates.get(index).split(":");
                    try (var insert = connection.prepareStatement(
                            "INSERT INTO posts (author_id,title,slug,content,status,visibility) VALUES (1,?,?,?,?,?)")) {
                        insert.setString(1, "Original title " + index);
                        insert.setString(2, "original-url-" + index);
                        insert.setString(3, originalContent);
                        insert.setString(4, state[0]);
                        insert.setString(5, state[1]);
                        insert.executeUpdate();
                    }
                }
                Flyway.configure().dataSource(database.getJdbcUrl(), database.getUsername(), database.getPassword())
                        .load().migrate();
                var actualStates = new ArrayList<String>();
                try (var rows = statement.executeQuery("SELECT id,title,slug,content,status,visibility FROM posts ORDER BY id")) {
                    int index = 0;
                    while (rows.next()) {
                        assertThat(rows.getLong("id")).isEqualTo(index + 1L);
                        assertThat(rows.getString("title")).isEqualTo("Original title " + index);
                        assertThat(rows.getString("slug")).isEqualTo("original-url-" + index);
                        assertThat(rows.getString("content")).isEqualTo(originalContent);
                        actualStates.add(rows.getString("status") + ":" + rows.getString("visibility"));
                        index++;
                    }
                }
                assertThat(actualStates).containsExactlyElementsOf(expectedStates);
                try (var table = statement.executeQuery("SELECT to_regclass('public.attachments')")) {
                    assertThat(table.next()).isTrue();
                    assertThat(table.getString(1)).isNotNull();
                }
                Flyway.configure().dataSource(database.getJdbcUrl(), database.getUsername(), database.getPassword())
                        .load().validate();
            }
        }
    }
}
