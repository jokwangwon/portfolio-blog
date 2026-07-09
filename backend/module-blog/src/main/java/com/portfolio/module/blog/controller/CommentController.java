package com.portfolio.module.blog.controller;

import com.portfolio.module.blog.dto.CommentRequest;
import com.portfolio.module.blog.dto.CommentResponse;
import com.portfolio.module.blog.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/portal/posts/{postId}/comments")
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping
    public ResponseEntity<Page<CommentResponse>> getComments(
            @PathVariable Long postId,
            @PageableDefault(size = 20) Pageable pageable) {
        return ResponseEntity.ok(commentService.getComments(postId, pageable));
    }

    @PostMapping
    public ResponseEntity<CommentResponse> createComment(
            @PathVariable Long postId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        CommentResponse response = commentService.createComment(postId, request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<CommentResponse> updateComment(
            @PathVariable Long postId,
            @PathVariable Long id,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(commentService.updateComment(postId, id, request, userDetails.getUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long postId,
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        commentService.deleteComment(postId, id, userDetails.getUsername());
        return ResponseEntity.noContent().build();
    }
}
