package com.portfolio.portal.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.domain.user.User;
import com.portfolio.domain.user.UserRole;
import com.portfolio.domain.user.repository.UserRepository;
import com.portfolio.module.blog.service.AttachmentReferences;
import com.portfolio.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MvcResult;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AttachmentConcurrencyIntegrationTest extends IntegrationTestBase {
    private static final Path STORAGE = temporaryStorage();

    @Autowired ObjectMapper mapper;
    @Autowired UserRepository users;
    @Autowired JwtTokenProvider jwt;
    @SpyBean AttachmentReferences references;

    @DynamicPropertySource
    static void attachmentProperties(DynamicPropertyRegistry registry) {
        registry.add("app.attachments.directory", () -> STORAGE.toString());
    }

    private static Path temporaryStorage() {
        try {
            return Files.createTempDirectory("portal-attachment-concurrency-");
        } catch (IOException e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    @Test
    void concurrentPostsCannotBothClaimTheSameUnattachedImage() throws Exception {
        String username = "attachment-concurrency-owner";
        users.save(User.builder().username(username).email("attachment-concurrency@example.com")
                .password("unused").role(UserRole.ADMIN).build());
        String authorization = "Bearer " + jwt.generateAccessToken(new UsernamePasswordAuthenticationToken(
                username, null, List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))));
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        assertTrue(ImageIO.write(new BufferedImage(4, 4, BufferedImage.TYPE_INT_RGB), "png", output));
        JsonNode upload = mapper.readTree(mockMvc.perform(multipart("/api/portal/attachments")
                        .file(new MockMultipartFile("file", "race.png", "image/png", output.toByteArray()))
                        .header("Authorization", authorization))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
        String url = upload.get("url").asText();
        mockMvc.perform(get(url)).andExpect(status().isNotFound());

        // Both independent HTTP transactions reach attachment synchronization before either claims it.
        CountDownLatch bothTransactions = new CountDownLatch(2);
        doAnswer(invocation -> {
            bothTransactions.countDown();
            assertTrue(bothTransactions.await(15, TimeUnit.SECONDS), "Both post transactions must overlap");
            return invocation.callRealMethod();
        }).when(references).extract(anyString());

        var executor = Executors.newFixedThreadPool(2);
        try {
            var first = executor.submit(() -> createPost("Concurrent study A", url, authorization));
            var second = executor.submit(() -> createPost("Concurrent study B", url, authorization));
            List<MvcResult> results = List.of(first.get(30, TimeUnit.SECONDS), second.get(30, TimeUnit.SECONDS));
            assertEquals(List.of(201, 400), results.stream()
                    .map(result -> result.getResponse().getStatus()).sorted().toList());
            MvcResult successful = results.stream().filter(result -> result.getResponse().getStatus() == 201)
                    .findFirst().orElseThrow();
            long winningPostId = mapper.readTree(successful.getResponse().getContentAsString()).get("id").asLong();
            mockMvc.perform(get("/api/portal/posts"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.totalElements").value(1))
                    .andExpect(jsonPath("$.content[0].id").value(winningPostId));
            mockMvc.perform(get(url)).andExpect(status().isOk());
        } finally {
            executor.shutdownNow();
            assertTrue(executor.awaitTermination(5, TimeUnit.SECONDS));
        }
    }

    private MvcResult createPost(String title, String imageUrl, String authorization) throws Exception {
        return mockMvc.perform(post("/api/portal/posts")
                        .header("Authorization", authorization).contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(Map.of("title", title,
                                "content", "![study diagram](" + imageUrl + ")",
                                "status", "PUBLISHED", "visibility", "PUBLIC"))))
                .andReturn();
    }
}
