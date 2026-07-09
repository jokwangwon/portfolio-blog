package com.portfolio.module.blog.controller;

import com.portfolio.domain.blog.Category;
import com.portfolio.module.blog.dto.CategoryRequest;
import com.portfolio.module.blog.service.CategoryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/portal/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllCategories() {
        List<Map<String, Object>> categories = categoryService.getAllCategories().stream()
                .map(c -> Map.<String, Object>of(
                        "id", c.getId(),
                        "name", c.getName(),
                        "slug", c.getSlug(),
                        "description", c.getDescription() != null ? c.getDescription() : ""
                ))
                .toList();
        return ResponseEntity.ok(categories);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getCategory(@PathVariable Long id) {
        Category c = categoryService.getCategory(id);
        return ResponseEntity.ok(Map.of(
                "id", c.getId(),
                "name", c.getName(),
                "slug", c.getSlug(),
                "description", c.getDescription() != null ? c.getDescription() : ""
        ));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createCategory(@Valid @RequestBody CategoryRequest request) {
        Category c = categoryService.createCategory(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", c.getId(),
                "name", c.getName(),
                "slug", c.getSlug()
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateCategory(
            @PathVariable Long id,
            @Valid @RequestBody CategoryRequest request) {
        Category c = categoryService.updateCategory(id, request);
        return ResponseEntity.ok(Map.of(
                "id", c.getId(),
                "name", c.getName(),
                "slug", c.getSlug()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return ResponseEntity.noContent().build();
    }
}
