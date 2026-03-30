package com.portfolio.module.blog.controller;

import com.portfolio.module.blog.dto.PostRequest;
import com.portfolio.module.blog.dto.PostResponse;
import com.portfolio.module.blog.service.PostService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class PostControllerTest {

    @Mock
    private PostService postService;

    @InjectMocks
    private PostController controller;

    private PostResponse postResponse;
    private UserDetails userDetails;
    private PageRequest pageable;

    @BeforeEach
    void setUp() {
        postResponse = PostResponse.builder()
                .id(1L)
                .title("Test Post")
                .slug("test-post")
                .status("PUBLISHED")
                .viewCount(0)
                .likeCount(0)
                .author(new PostResponse.AuthorDto(1L, "testuser"))
                .tags(List.of())
                .build();

        userDetails = new User("testuser", "password", Collections.emptyList());
        pageable = PageRequest.of(0, 20);
    }

    @Test
    @DisplayName("GET /posts - 발행된 게시글 목록을 반환한다")
    void getPublishedPosts() {
        given(postService.getPublishedPosts(any())).willReturn(new PageImpl<>(List.of(postResponse)));

        ResponseEntity<Page<PostResponse>> response = controller.getPosts(null, null, pageable);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getContent()).hasSize(1);
    }

    @Test
    @DisplayName("GET /posts?categoryId=1 - 카테고리별 게시글을 반환한다")
    void getPostsByCategory() {
        given(postService.getPostsByCategory(eq(1L), any())).willReturn(new PageImpl<>(List.of(postResponse)));

        ResponseEntity<Page<PostResponse>> response = controller.getPosts(1L, null, pageable);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("GET /posts?tag=java - 태그별 게시글을 반환한다")
    void getPostsByTag() {
        given(postService.getPostsByTag(eq("java"), any())).willReturn(new PageImpl<>(List.of(postResponse)));

        ResponseEntity<Page<PostResponse>> response = controller.getPosts(null, "java", pageable);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("GET /posts/{id} - 게시글 상세를 반환한다")
    void getPost() {
        given(postService.getPost(1L)).willReturn(postResponse);

        ResponseEntity<PostResponse> response = controller.getPost(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getTitle()).isEqualTo("Test Post");
    }

    @Test
    @DisplayName("POST /posts - 201과 생성된 게시글을 반환한다")
    void createPost() {
        given(postService.createPost(any(), eq("testuser"))).willReturn(postResponse);

        ResponseEntity<PostResponse> response = controller.createPost(new PostRequest(), userDetails);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    @DisplayName("PUT /posts/{id} - 수정된 게시글을 반환한다")
    void updatePost() {
        given(postService.updatePost(eq(1L), any(), eq("testuser"))).willReturn(postResponse);

        ResponseEntity<PostResponse> response = controller.updatePost(1L, new PostRequest(), userDetails);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("DELETE /posts/{id} - 204를 반환한다")
    void deletePost() {
        ResponseEntity<Void> response = controller.deletePost(1L, userDetails);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(postService).deletePost(1L, "testuser");
    }

    @Test
    @DisplayName("POST /posts/{id}/like - 좋아요 결과를 반환한다")
    void likePost() {
        ResponseEntity<Map<String, Object>> response = controller.likePost(1L, userDetails);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("liked")).isEqualTo(true);
        verify(postService).likePost(1L, "testuser");
    }

    @Test
    @DisplayName("DELETE /posts/{id}/like - 좋아요 취소 결과를 반환한다")
    void unlikePost() {
        ResponseEntity<Map<String, Object>> response = controller.unlikePost(1L, userDetails);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("liked")).isEqualTo(false);
    }
}
