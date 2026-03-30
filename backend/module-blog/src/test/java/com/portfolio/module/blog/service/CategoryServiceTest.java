package com.portfolio.module.blog.service;

import com.portfolio.common.exception.DuplicateResourceException;
import com.portfolio.common.exception.ResourceNotFoundException;
import com.portfolio.domain.blog.Category;
import com.portfolio.domain.blog.repository.CategoryRepository;
import com.portfolio.module.blog.dto.CategoryRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.BDDMockito.given;
import static org.mockito.Mockito.verify;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository categoryRepository;

    @InjectMocks
    private CategoryService categoryService;

    private Category category;

    @BeforeEach
    void setUp() {
        category = Category.builder()
                .name("Spring")
                .slug("spring")
                .description("Spring Framework")
                .build();
        ReflectionTestUtils.setField(category, "id", 1L);
    }

    @Nested
    @DisplayName("getAllCategories")
    class GetAllCategories {

        @Test
        @DisplayName("모든 카테고리를 조회한다")
        void returnAllCategories() {
            given(categoryRepository.findAll()).willReturn(List.of(category));

            List<Category> result = categoryService.getAllCategories();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Spring");
        }
    }

    @Nested
    @DisplayName("getCategory")
    class GetCategory {

        @Test
        @DisplayName("ID로 카테고리를 조회한다")
        void returnCategoryById() {
            given(categoryRepository.findById(1L)).willReturn(Optional.of(category));

            Category result = categoryService.getCategory(1L);

            assertThat(result.getName()).isEqualTo("Spring");
        }

        @Test
        @DisplayName("존재하지 않는 카테고리 조회 시 예외를 던진다")
        void throwWhenNotFound() {
            given(categoryRepository.findById(anyLong())).willReturn(Optional.empty());

            assertThatThrownBy(() -> categoryService.getCategory(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("카테고리를 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("createCategory")
    class CreateCategory {

        @Test
        @DisplayName("새 카테고리를 생성한다")
        void createNewCategory() {
            CategoryRequest request = new CategoryRequest();
            ReflectionTestUtils.setField(request, "name", "Java");
            ReflectionTestUtils.setField(request, "description", "Java Language");

            given(categoryRepository.existsByName("Java")).willReturn(false);
            given(categoryRepository.save(any(Category.class))).willAnswer(invocation -> {
                Category saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 2L);
                return saved;
            });

            Category result = categoryService.createCategory(request);

            assertThat(result.getName()).isEqualTo("Java");
            assertThat(result.getSlug()).isEqualTo("java");
            verify(categoryRepository).save(any(Category.class));
        }

        @Test
        @DisplayName("중복된 이름으로 생성 시 예외를 던진다")
        void throwWhenDuplicateName() {
            CategoryRequest request = new CategoryRequest();
            ReflectionTestUtils.setField(request, "name", "Spring");

            given(categoryRepository.existsByName("Spring")).willReturn(true);

            assertThatThrownBy(() -> categoryService.createCategory(request))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("이미 존재하는 카테고리입니다");
        }
    }

    @Nested
    @DisplayName("updateCategory")
    class UpdateCategory {

        @Test
        @DisplayName("카테고리를 수정한다")
        void updateExistingCategory() {
            CategoryRequest request = new CategoryRequest();
            ReflectionTestUtils.setField(request, "name", "Spring Boot");
            ReflectionTestUtils.setField(request, "description", "Updated desc");

            given(categoryRepository.findById(1L)).willReturn(Optional.of(category));

            Category result = categoryService.updateCategory(1L, request);

            assertThat(result.getName()).isEqualTo("Spring Boot");
            assertThat(result.getSlug()).isEqualTo("spring-boot");
            assertThat(result.getDescription()).isEqualTo("Updated desc");
        }

        @Test
        @DisplayName("존재하지 않는 카테고리 수정 시 예외를 던진다")
        void throwWhenNotFound() {
            CategoryRequest request = new CategoryRequest();
            ReflectionTestUtils.setField(request, "name", "None");

            given(categoryRepository.findById(anyLong())).willReturn(Optional.empty());

            assertThatThrownBy(() -> categoryService.updateCategory(999L, request))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }

    @Nested
    @DisplayName("deleteCategory")
    class DeleteCategory {

        @Test
        @DisplayName("카테고리를 삭제한다")
        void deleteExistingCategory() {
            given(categoryRepository.existsById(1L)).willReturn(true);

            categoryService.deleteCategory(1L);

            verify(categoryRepository).deleteById(1L);
        }

        @Test
        @DisplayName("존재하지 않는 카테고리 삭제 시 예외를 던진다")
        void throwWhenNotFound() {
            given(categoryRepository.existsById(anyLong())).willReturn(false);

            assertThatThrownBy(() -> categoryService.deleteCategory(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
