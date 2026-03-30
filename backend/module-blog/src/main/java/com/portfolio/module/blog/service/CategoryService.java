package com.portfolio.module.blog.service;

import com.portfolio.domain.blog.Category;
import com.portfolio.domain.blog.repository.CategoryRepository;
import com.portfolio.module.blog.dto.CategoryRequest;
import com.portfolio.common.exception.DuplicateResourceException;
import com.portfolio.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public List<Category> getAllCategories() {
        return categoryRepository.findAll();
    }

    public Category getCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CATEGORY_NOT_FOUND", "카테고리를 찾을 수 없습니다"));
    }

    @Transactional
    public Category createCategory(CategoryRequest request) {
        if (categoryRepository.existsByName(request.getName())) {
            throw new DuplicateResourceException("CATEGORY_DUPLICATE", "이미 존재하는 카테고리입니다: " + request.getName());
        }

        String slug = request.getName().toLowerCase()
                .replaceAll("[^a-z0-9가-힣\\s-]", "")
                .replaceAll("[\\s]+", "-");

        Category category = Category.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .build();

        return categoryRepository.save(category);
    }

    @Transactional
    public Category updateCategory(Long id, CategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CATEGORY_NOT_FOUND", "카테고리를 찾을 수 없습니다"));

        String slug = request.getName().toLowerCase()
                .replaceAll("[^a-z0-9가-힣\\s-]", "")
                .replaceAll("[\\s]+", "-");
        category.update(request.getName(), slug, request.getDescription());
        return category;
    }

    @Transactional
    public void deleteCategory(Long id) {
        if (!categoryRepository.existsById(id)) {
            throw new ResourceNotFoundException("CATEGORY_NOT_FOUND", "카테고리를 찾을 수 없습니다");
        }
        categoryRepository.deleteById(id);
    }
}
