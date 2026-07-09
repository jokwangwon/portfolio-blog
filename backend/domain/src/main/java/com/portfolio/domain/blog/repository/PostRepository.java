package com.portfolio.domain.blog.repository;

import com.portfolio.domain.blog.Post;
import com.portfolio.domain.blog.PostStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    Optional<Post> findBySlugAndDeletedAtIsNull(String slug);

    Optional<Post> findByIdAndDeletedAtIsNull(Long id);

    boolean existsBySlugAndDeletedAtIsNull(String slug);

    @Query("SELECT p FROM Post p WHERE p.deletedAt IS NULL AND p.status = :status ORDER BY p.publishedAt DESC")
    Page<Post> findAllByStatusAndDeletedAtIsNull(@Param("status") PostStatus status, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.deletedAt IS NULL AND p.status = 'PUBLISHED' " +
           "AND (p.category.id = :categoryId OR :categoryId IS NULL) " +
           "AND p.status = 'PUBLISHED' ORDER BY p.publishedAt DESC")
    Page<Post> findPublishedByCategory(@Param("categoryId") Long categoryId, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.deletedAt IS NULL AND p.status = 'PUBLISHED' " +
           "AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Post> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT p FROM Post p JOIN p.tags t WHERE p.deletedAt IS NULL " +
           "AND p.status = 'PUBLISHED' AND t.slug = :tagSlug")
    Page<Post> findPublishedByTag(@Param("tagSlug") String tagSlug, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.deletedAt IS NULL AND p.author.id = :authorId")
    Page<Post> findAllByAuthor(@Param("authorId") Long authorId, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.deletedAt IS NULL AND p.author.id = :authorId AND p.status = :status")
    Page<Post> findAllByAuthorAndStatus(@Param("authorId") Long authorId, @Param("status") PostStatus status, Pageable pageable);
}
