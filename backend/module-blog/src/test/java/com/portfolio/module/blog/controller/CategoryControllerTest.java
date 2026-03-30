package com.portfolio.module.blog.controller;

import com.portfolio.domain.blog.Category;
import com.portfolio.module.blog.service.CategoryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CategoryControllerTest {

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private CategoryController controller;

    private Category category;

    @BeforeEach
    void setUp() {
        category = Category.builder().name("Spring").slug("spring").description("Spring Framework").build();
        ReflectionTestUtils.setField(category, "id", 1L);
    }

    @Test
    @DisplayName("GET /categories - 200과 카테고리 목록을 반환한다")
    void getAllCategories() {
        given(categoryService.getAllCategories()).willReturn(List.of(category));

        ResponseEntity<List<Map<String, Object>>> response = controller.getAllCategories();

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).hasSize(1);
        assertThat(response.getBody().get(0).get("name")).isEqualTo("Spring");
    }

    @Test
    @DisplayName("GET /categories/{id} - 200과 카테고리 상세를 반환한다")
    void getCategory() {
        given(categoryService.getCategory(1L)).willReturn(category);

        ResponseEntity<Map<String, Object>> response = controller.getCategory(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().get("name")).isEqualTo("Spring");
    }

    @Test
    @DisplayName("POST /categories - 201과 생성된 카테고리를 반환한다")
    void createCategory() {
        given(categoryService.createCategory(any())).willReturn(category);

        ResponseEntity<Map<String, Object>> response = controller.createCategory(null);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody().get("slug")).isEqualTo("spring");
    }

    @Test
    @DisplayName("DELETE /categories/{id} - 204를 반환한다")
    void deleteCategory() {
        ResponseEntity<Void> response = controller.deleteCategory(1L);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);
        verify(categoryService).deleteCategory(1L);
    }
}
