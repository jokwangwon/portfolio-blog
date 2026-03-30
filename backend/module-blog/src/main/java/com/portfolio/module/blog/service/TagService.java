package com.portfolio.module.blog.service;

import com.portfolio.domain.blog.Tag;
import com.portfolio.domain.blog.repository.TagRepository;
import com.portfolio.module.blog.dto.TagRequest;
import com.portfolio.common.exception.DuplicateResourceException;
import com.portfolio.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class TagService {

    private final TagRepository tagRepository;

    public List<Tag> getAllTags() {
        return tagRepository.findAll();
    }

    public Tag getTag(Long id) {
        return tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("TAG_NOT_FOUND", "태그를 찾을 수 없습니다"));
    }

    @Transactional
    public Tag createTag(TagRequest request) {
        if (tagRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("TAG_DUPLICATE", "이미 존재하는 태그입니다: " + request.getName());
        }

        String slug = request.getName().toLowerCase()
                .replaceAll("[^a-z0-9가-힣\\s-]", "")
                .replaceAll("[\\s]+", "-");

        Tag tag = Tag.builder()
                .name(request.getName())
                .slug(slug)
                .build();

        return tagRepository.save(tag);
    }

    @Transactional
    public void deleteTag(Long id) {
        if (!tagRepository.existsById(id)) {
            throw new ResourceNotFoundException("TAG_NOT_FOUND", "태그를 찾을 수 없습니다");
        }
        tagRepository.deleteById(id);
    }
}
