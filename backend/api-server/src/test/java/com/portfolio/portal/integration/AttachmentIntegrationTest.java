package com.portfolio.portal.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.domain.user.User;
import com.portfolio.domain.user.UserRole;
import com.portfolio.domain.user.repository.UserRepository;
import com.portfolio.security.jwt.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class AttachmentIntegrationTest extends IntegrationTestBase {
    private static final String ENDPOINT = "/api/portal/attachments";
    private static final Path STORAGE = temporaryStorage();

    @Autowired ObjectMapper mapper;
    @Autowired UserRepository users;
    @Autowired JwtTokenProvider jwt;

    @DynamicPropertySource
    static void attachmentProperties(DynamicPropertyRegistry registry) {
        registry.add("app.attachments.directory", () -> STORAGE.toString());
    }

    private static Path temporaryStorage() {
        try {
            return Files.createTempDirectory("portal-attachment-integration-");
        } catch (IOException e) {
            throw new ExceptionInInitializerError(e);
        }
    }

    @BeforeEach
    void createUsers() {
        users.save(User.builder().username("attachment-owner").email("attachment-owner@example.com")
                .password("unused").role(UserRole.ADMIN).build());
        users.save(User.builder().username("attachment-other").email("attachment-other@example.com")
                .password("unused").role(UserRole.USER).build());
    }

    private String token(String username) {
        String role = username.equals("attachment-owner") ? "ROLE_ADMIN" : "ROLE_USER";
        return "Bearer " + jwt.generateAccessToken(new UsernamePasswordAuthenticationToken(
                username, null, List.of(new SimpleGrantedAuthority(role))));
    }

    private byte[] image(String format, int width, int height) throws IOException {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        image.setRGB(0, 0, 0x3266AA);
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        assertTrue(ImageIO.write(image, format, output));
        return output.toByteArray();
    }

    private JsonNode upload(String username) throws Exception {
        return mapper.readTree(mockMvc.perform(multipart(ENDPOINT)
                        .file(new MockMultipartFile("file", "study.png", "image/png", image("png", 8, 6)))
                        .header("Authorization", token(username)))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString());
    }

    private Map<String, Object> postBody(String content, String state, String visibility) {
        return Map.of("title", "Attachment study", "content", content,
                "status", state, "visibility", visibility);
    }

    private long createPost(String username, String content, String state, String visibility) throws Exception {
        return mapper.readTree(mockMvc.perform(post("/api/portal/posts")
                        .header("Authorization", token(username)).contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(postBody(content, state, visibility))))
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString()).get("id").asLong();
    }

    private void updatePost(long id, String content, String state, String visibility) throws Exception {
        mockMvc.perform(put("/api/portal/posts/" + id).header("Authorization", token("attachment-owner"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(postBody(content, state, visibility))))
                .andExpect(status().isOk());
    }

    @Test
    void uploadedImageIsValidatedAndUnattachedImageIsOwnerOnly() throws Exception {
        JsonNode uploaded = upload("attachment-owner");
        assertDoesNotThrow(() -> UUID.fromString(uploaded.get("id").asText()));
        String url = uploaded.get("url").asText();
        assertEquals(ENDPOINT + "/" + uploaded.get("id").asText(), url);
        assertEquals("image/png", uploaded.get("mediaType").asText());
        assertEquals(8, uploaded.get("width").asInt());
        assertEquals(6, uploaded.get("height").asInt());
        assertTrue(uploaded.get("byteSize").asLong() > 0);
        byte[] bytes = mockMvc.perform(get(url).header("Authorization", token("attachment-owner")))
                .andExpect(status().isOk()).andExpect(content().contentType("image/png"))
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andReturn().getResponse().getContentAsByteArray();
        assertEquals(uploaded.get("byteSize").asLong(), bytes.length);
        assertEquals(8, ImageIO.read(new ByteArrayInputStream(bytes)).getWidth());
        mockMvc.perform(get(url)).andExpect(status().isNotFound());
        mockMvc.perform(get(url).header("Authorization", token("attachment-other")))
                .andExpect(status().isNotFound());
    }

    @Test
    void publicImageVisibilityTracksPrivacyDraftAndSoftDeletion() throws Exception {
        String url = upload("attachment-owner").get("url").asText();
        String content = "Study diagram\n\n![array](" + url + ")";
        long id = createPost("attachment-owner", content, "PUBLISHED", "PUBLIC");
        mockMvc.perform(get(url)).andExpect(status().isOk())
                .andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"));
        updatePost(id, content, "PUBLISHED", "PRIVATE");
        mockMvc.perform(get(url)).andExpect(status().isNotFound());
        mockMvc.perform(get(url).header("Authorization", token("attachment-owner"))).andExpect(status().isOk());
        updatePost(id, content, "DRAFT", "PUBLIC");
        mockMvc.perform(get(url)).andExpect(status().isNotFound());
        updatePost(id, content, "PUBLISHED", "PUBLIC");
        mockMvc.perform(get(url)).andExpect(status().isOk());
        mockMvc.perform(delete("/api/portal/posts/" + id).header("Authorization", token("attachment-owner")))
                .andExpect(status().isNoContent());
        mockMvc.perform(get(url)).andExpect(status().isNotFound());
    }

    @Test
    void rawHtmlImageReferencesAreBoundAndRemovedReferencesBecomePrivate() throws Exception {
        String url = upload("attachment-owner").get("url").asText();
        long id = createPost("attachment-owner", "<p>Tree</p><img src=\"" + url + "\" alt=\"tree\">", "PUBLISHED", "PUBLIC");
        mockMvc.perform(get(url)).andExpect(status().isOk());
        updatePost(id, "The diagram was removed.", "PUBLISHED", "PUBLIC");
        mockMvc.perform(get(url)).andExpect(status().isNotFound());
        mockMvc.perform(get(url).header("Authorization", token("attachment-owner"))).andExpect(status().isOk());
    }

    @Test
    void mentioningImageUrlInCodeDoesNotPublishUnattachedImage() throws Exception {
        String url = upload("attachment-owner").get("url").asText();
        createPost("attachment-owner", "Example only:\n\n```markdown\n![private](" + url + ")\n```", "PUBLISHED", "PUBLIC");
        mockMvc.perform(get(url)).andExpect(status().isNotFound());
    }

    @Test
    void anotherUsersAttachmentCannotBeBoundAndFailedUpdateRollsBackExistingReferences() throws Exception {
        String ownUrl = upload("attachment-owner").get("url").asText();
        String otherUrl = upload("attachment-other").get("url").asText();
        String original = "![own](" + ownUrl + ")";
        long id = createPost("attachment-owner", original, "PUBLISHED", "PUBLIC");
        mockMvc.perform(put("/api/portal/posts/" + id).header("Authorization", token("attachment-owner"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(postBody("![foreign](" + otherUrl + ")", "PUBLISHED", "PRIVATE"))))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/portal/posts/" + id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value(original)).andExpect(jsonPath("$.visibility").value("PUBLIC"));
        mockMvc.perform(get(ownUrl)).andExpect(status().isOk());
        mockMvc.perform(get(otherUrl)).andExpect(status().isNotFound());
    }

    @Test
    void attachmentCannotBeSharedAcrossPostsAndFailedCreateLeavesNoNewPost() throws Exception {
        String url = upload("attachment-owner").get("url").asText();
        String content = "![one post](" + url + ")";
        createPost("attachment-owner", content, "PUBLISHED", "PUBLIC");
        mockMvc.perform(post("/api/portal/posts").header("Authorization", token("attachment-owner"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(postBody(content, "PUBLISHED", "PUBLIC"))))
                .andExpect(status().isBadRequest());
        mockMvc.perform(get("/api/portal/posts")).andExpect(jsonPath("$.totalElements").value(1));
        mockMvc.perform(get(url)).andExpect(status().isOk());
    }

    @Test
    void malformedUnsupportedAndOversizedImagesAreRejected() throws Exception {
        for (MockMultipartFile file : List.of(
                new MockMultipartFile("file", "fake.png", "image/png", "not an image".getBytes()),
                new MockMultipartFile("file", "animation.gif", "image/gif", image("gif", 2, 2)),
                new MockMultipartFile("file", "wide.png", "image/png", image("png", 8193, 1)))) {
            mockMvc.perform(multipart(ENDPOINT).file(file).header("Authorization", token("attachment-owner")))
                    .andExpect(status().isBadRequest());
        }
        mockMvc.perform(multipart(ENDPOINT)
                        .file(new MockMultipartFile("file", "large.png", "image/png", new byte[10 * 1024 * 1024 + 1]))
                        .header("Authorization", token("attachment-owner")))
                .andExpect(status().isPayloadTooLarge());
    }

    @Test
    void jpegIsAcceptedAndAnonymousUploadIsRejected() throws Exception {
        MockMultipartFile jpeg = new MockMultipartFile("file", "study.jpg", "image/jpeg", image("jpeg", 4, 3));
        mockMvc.perform(multipart(ENDPOINT).file(jpeg)).andExpect(status().isUnauthorized());
        mockMvc.perform(multipart(ENDPOINT).file(jpeg).header("Authorization", token("attachment-owner")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.mediaType").value("image/jpeg"))
                .andExpect(jsonPath("$.width").value(4)).andExpect(jsonPath("$.height").value(3));
    }
}
