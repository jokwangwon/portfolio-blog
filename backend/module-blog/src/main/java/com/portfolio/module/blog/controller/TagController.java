package com.portfolio.module.blog.controller;

import com.portfolio.domain.blog.Tag;
import com.portfolio.module.blog.dto.TagRequest;
import com.portfolio.module.blog.service.TagService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/portal/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;

    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getAllTags() {
        List<Map<String, Object>> tags = tagService.getAllTags().stream()
                .map(t -> Map.<String, Object>of(
                        "id", t.getId(),
                        "name", t.getName(),
                        "slug", t.getSlug()
                ))
                .toList();
        return ResponseEntity.ok(tags);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTag(@PathVariable Long id) {
        Tag t = tagService.getTag(id);
        return ResponseEntity.ok(Map.of(
                "id", t.getId(),
                "name", t.getName(),
                "slug", t.getSlug()
        ));
    }

    @PostMapping
    public ResponseEntity<Map<String, Object>> createTag(@Valid @RequestBody TagRequest request) {
        Tag t = tagService.createTag(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", t.getId(),
                "name", t.getName(),
                "slug", t.getSlug()
        ));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        tagService.deleteTag(id);
        return ResponseEntity.noContent().build();
    }
}
