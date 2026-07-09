package com.portfolio.module.blog.service;

import com.portfolio.common.exception.DuplicateResourceException;
import com.portfolio.common.exception.ResourceNotFoundException;
import com.portfolio.domain.blog.Tag;
import com.portfolio.domain.blog.repository.TagRepository;
import com.portfolio.module.blog.dto.TagRequest;
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
class TagServiceTest {

    @Mock
    private TagRepository tagRepository;

    @InjectMocks
    private TagService tagService;

    private Tag tag;

    @BeforeEach
    void setUp() {
        tag = Tag.builder()
                .name("Java")
                .slug("java")
                .build();
        ReflectionTestUtils.setField(tag, "id", 1L);
    }

    @Nested
    @DisplayName("getAllTags")
    class GetAllTags {

        @Test
        @DisplayName("모든 태그를 조회한다")
        void returnAllTags() {
            given(tagRepository.findAll()).willReturn(List.of(tag));

            List<Tag> result = tagService.getAllTags();

            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Java");
        }
    }

    @Nested
    @DisplayName("getTag")
    class GetTag {

        @Test
        @DisplayName("ID로 태그를 조회한다")
        void returnTagById() {
            given(tagRepository.findById(1L)).willReturn(Optional.of(tag));

            Tag result = tagService.getTag(1L);

            assertThat(result.getName()).isEqualTo("Java");
        }

        @Test
        @DisplayName("존재하지 않는 태그 조회 시 예외를 던진다")
        void throwWhenNotFound() {
            given(tagRepository.findById(anyLong())).willReturn(Optional.empty());

            assertThatThrownBy(() -> tagService.getTag(999L))
                    .isInstanceOf(ResourceNotFoundException.class)
                    .hasMessageContaining("태그를 찾을 수 없습니다");
        }
    }

    @Nested
    @DisplayName("createTag")
    class CreateTag {

        @Test
        @DisplayName("새 태그를 생성한다")
        void createNewTag() {
            TagRequest request = new TagRequest();
            ReflectionTestUtils.setField(request, "name", "Spring");

            given(tagRepository.existsByName("Spring")).willReturn(false);
            given(tagRepository.save(any(Tag.class))).willAnswer(invocation -> {
                Tag saved = invocation.getArgument(0);
                ReflectionTestUtils.setField(saved, "id", 2L);
                return saved;
            });

            Tag result = tagService.createTag(request);

            assertThat(result.getName()).isEqualTo("Spring");
            assertThat(result.getSlug()).isEqualTo("spring");
            verify(tagRepository).save(any(Tag.class));
        }

        @Test
        @DisplayName("중복된 이름으로 생성 시 예외를 던진다")
        void throwWhenDuplicateName() {
            TagRequest request = new TagRequest();
            ReflectionTestUtils.setField(request, "name", "Java");

            given(tagRepository.existsByName("Java")).willReturn(true);

            assertThatThrownBy(() -> tagService.createTag(request))
                    .isInstanceOf(DuplicateResourceException.class)
                    .hasMessageContaining("이미 존재하는 태그입니다");
        }
    }

    @Nested
    @DisplayName("deleteTag")
    class DeleteTag {

        @Test
        @DisplayName("태그를 삭제한다")
        void deleteExistingTag() {
            given(tagRepository.existsById(1L)).willReturn(true);

            tagService.deleteTag(1L);

            verify(tagRepository).deleteById(1L);
        }

        @Test
        @DisplayName("존재하지 않는 태그 삭제 시 예외를 던진다")
        void throwWhenNotFound() {
            given(tagRepository.existsById(anyLong())).willReturn(false);

            assertThatThrownBy(() -> tagService.deleteTag(999L))
                    .isInstanceOf(ResourceNotFoundException.class);
        }
    }
}
