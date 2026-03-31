package com.portfolio.portal.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.portfolio.domain.blog.repository.CategoryRepository;
import com.portfolio.domain.user.User;
import com.portfolio.domain.user.UserRole;
import com.portfolio.domain.user.repository.UserRepository;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@DisplayName("Blog API 통합 테스트")
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class BlogApiIntegrationTest extends IntegrationTestBase {

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String adminAccessToken;
    private String userAccessToken;

    @BeforeEach
    void setUpTokens() throws Exception {
        // IntegrationTestBase.cleanDatabase()가 먼저 실행됨
        adminAccessToken = createAdminAndGetToken();
        userAccessToken = createUserAndGetToken();
    }

    // === Category API Tests ===

    @Test
    @Order(1)
    @DisplayName("카테고리 목록 조회 (공개) → 200")
    void getCategories_public_success() throws Exception {
        createCategory("Technology", "Tech articles");

        mockMvc.perform(get("/api/portal/categories"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[0].name").value("Technology"))
                .andExpect(jsonPath("$[0].slug").exists());
    }

    @Test
    @Order(2)
    @DisplayName("카테고리 생성 (ADMIN) → 201")
    void createCategory_admin_success() throws Exception {
        mockMvc.perform(post("/api/portal/categories")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("name", "Algorithm", "description", "Problem solving"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Algorithm"))
                .andExpect(jsonPath("$.slug").exists());

        assertThat(categoryRepository.existsByName("Algorithm")).isTrue();
    }

    @Test
    @Order(3)
    @DisplayName("카테고리 생성 (일반 사용자) → 403")
    void createCategory_normalUser_forbidden() throws Exception {
        mockMvc.perform(post("/api/portal/categories")
                        .header("Authorization", "Bearer " + userAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("name", "Unauthorized"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(4)
    @DisplayName("카테고리 수정 (ADMIN) → 200")
    void updateCategory_admin_success() throws Exception {
        Long categoryId = createCategory("Old Name", "Old desc");

        mockMvc.perform(put("/api/portal/categories/" + categoryId)
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("name", "New Name", "description", "New desc"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("New Name"));
    }

    @Test
    @Order(5)
    @DisplayName("카테고리 삭제 (ADMIN) → 204")
    void deleteCategory_admin_success() throws Exception {
        Long categoryId = createCategory("ToDelete", "Will be deleted");

        mockMvc.perform(delete("/api/portal/categories/" + categoryId)
                        .header("Authorization", "Bearer " + adminAccessToken))
                .andExpect(status().isNoContent());

        assertThat(categoryRepository.findById(categoryId)).isEmpty();
    }

    @Test
    @Order(6)
    @DisplayName("존재하지 않는 카테고리 조회 → 404")
    void getCategory_notFound() throws Exception {
        mockMvc.perform(get("/api/portal/categories/99999"))
                .andExpect(status().isNotFound());
    }

    // === Post API Tests ===

    @Test
    @Order(10)
    @DisplayName("게시글 생성 (인증) → 201")
    void createPost_authenticated_success() throws Exception {
        mockMvc.perform(post("/api/portal/posts")
                        .header("Authorization", "Bearer " + userAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("title", "My First Post",
                                        "content", "This is the content of my first post with enough text.",
                                        "status", "PUBLISHED"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("My First Post"))
                .andExpect(jsonPath("$.slug").exists())
                .andExpect(jsonPath("$.excerpt").exists())
                .andExpect(jsonPath("$.author.username").value("normaluser"));
    }

    @Test
    @Order(11)
    @DisplayName("게시글 생성 (미인증) → 403")
    void createPost_unauthenticated_forbidden() throws Exception {
        mockMvc.perform(post("/api/portal/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("title", "Unauthorized", "content", "Should fail"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(12)
    @DisplayName("게시글 목록 조회 (공개) → 200")
    void getPosts_public_success() throws Exception {
        createPost("Test Post", "Content here", "PUBLISHED");

        mockMvc.perform(get("/api/portal/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @Order(13)
    @DisplayName("게시글 단건 조회 → 200 + viewCount 증가")
    void getPost_incrementsViewCount() throws Exception {
        Long postId = createPost("View Test", "Content", "PUBLISHED");

        mockMvc.perform(get("/api/portal/posts/" + postId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("View Test"))
                .andExpect(jsonPath("$.viewCount").value(1));

        mockMvc.perform(get("/api/portal/posts/" + postId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.viewCount").value(2));
    }

    @Test
    @Order(14)
    @DisplayName("게시글 수정 (작성자) → 200")
    void updatePost_author_success() throws Exception {
        Long postId = createPost("Original Title", "Original content", "DRAFT");

        mockMvc.perform(put("/api/portal/posts/" + postId)
                        .header("Authorization", "Bearer " + userAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("title", "Updated Title", "content", "Updated content", "status", "PUBLISHED"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Updated Title"));
    }

    @Test
    @Order(15)
    @DisplayName("게시글 수정 (타인) → 403")
    void updatePost_notAuthor_forbidden() throws Exception {
        Long postId = createPost("Other User Post", "Content", "DRAFT");

        mockMvc.perform(put("/api/portal/posts/" + postId)
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("title", "Hacked", "content", "Hacked"))))
                .andExpect(status().isForbidden());
    }

    @Test
    @Order(16)
    @DisplayName("게시글 삭제 (작성자) → 204 (Soft Delete)")
    void deletePost_author_success() throws Exception {
        Long postId = createPost("To Delete", "Content", "DRAFT");

        mockMvc.perform(delete("/api/portal/posts/" + postId)
                        .header("Authorization", "Bearer " + userAccessToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/portal/posts/" + postId))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(17)
    @DisplayName("게시글 좋아요 → 200 + likeCount 증가")
    void likePost_success() throws Exception {
        Long postId = createPost("Like Test", "Content", "PUBLISHED");

        mockMvc.perform(post("/api/portal/posts/" + postId + "/like")
                        .header("Authorization", "Bearer " + userAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(true));

        mockMvc.perform(get("/api/portal/posts/" + postId))
                .andExpect(jsonPath("$.likeCount").value(1));
    }

    @Test
    @Order(18)
    @DisplayName("게시글 좋아요 취소 → 200 + likeCount 감소")
    void unlikePost_success() throws Exception {
        Long postId = createPost("Unlike Test", "Content", "PUBLISHED");

        mockMvc.perform(post("/api/portal/posts/" + postId + "/like")
                .header("Authorization", "Bearer " + userAccessToken));

        mockMvc.perform(delete("/api/portal/posts/" + postId + "/like")
                        .header("Authorization", "Bearer " + userAccessToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(false));

        mockMvc.perform(get("/api/portal/posts/" + postId))
                .andExpect(jsonPath("$.likeCount").value(0));
    }

    @Test
    @Order(19)
    @DisplayName("게시글 검색 → 200")
    void searchPosts_success() throws Exception {
        createPost("Spring Boot Tutorial", "Learn Spring Boot basics", "PUBLISHED");
        createPost("React Guide", "Frontend development with React", "PUBLISHED");

        mockMvc.perform(get("/api/portal/posts/search")
                        .param("keyword", "Spring"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    @Order(20)
    @DisplayName("카테고리별 게시글 조회 → 200")
    void getPostsByCategory_success() throws Exception {
        Long categoryId = createCategory("Tech", "Technology articles");
        createPostWithCategory("Categorized Post", "Content", "PUBLISHED", categoryId);

        mockMvc.perform(get("/api/portal/posts")
                        .param("categoryId", categoryId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    // === Helper Methods ===

    private String createAdminAndGetToken() throws Exception {
        User admin = User.builder()
                .email("admin@example.com")
                .username("adminuser")
                .password(passwordEncoder.encode("AdminPass123"))
                .role(UserRole.ADMIN)
                .build();
        userRepository.save(admin);

        MvcResult result = mockMvc.perform(post("/api/portal/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("username", "adminuser", "password", "AdminPass123"))))
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    private String createUserAndGetToken() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/portal/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("email", "user@example.com", "username", "normaluser", "password", "UserPass123"))))
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("accessToken").asText();
    }

    private Long createCategory(String name, String description) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/portal/categories")
                        .header("Authorization", "Bearer " + adminAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("name", name, "description", description))))
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private Long createPost(String title, String content, String status) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/portal/posts")
                        .header("Authorization", "Bearer " + userAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("title", title, "content", content, "status", status))))
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }

    private Long createPostWithCategory(String title, String content, String status, Long categoryId) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/portal/posts")
                        .header("Authorization", "Bearer " + userAccessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                Map.of("title", title, "content", content, "status", status, "categoryId", categoryId))))
                .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asLong();
    }
}
