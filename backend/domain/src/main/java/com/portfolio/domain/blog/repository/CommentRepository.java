package com.portfolio.domain.blog.repository;

import com.portfolio.domain.blog.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CommentRepository extends JpaRepository<Comment, Long> {

    Optional<Comment> findByIdAndDeletedAtIsNull(Long id);

    @Query("SELECT c FROM Comment c WHERE c.post.id = :postId AND c.parent IS NULL " +
           "ORDER BY c.createdAt ASC")
    Page<Comment> findRootCommentsByPostId(@Param("postId") Long postId, Pageable pageable);

    @Query("SELECT c FROM Comment c WHERE c.parent.id = :parentId ORDER BY c.createdAt ASC")
    List<Comment> findRepliesByParentId(@Param("parentId") Long parentId);

    long countByPostIdAndDeletedAtIsNull(Long postId);
}
