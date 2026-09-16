package com.portfolio.domain.blog.repository;

import com.portfolio.domain.blog.Post;
import com.portfolio.domain.blog.PostStatus;
import com.portfolio.domain.blog.PostVisibility;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {

    @org.springframework.data.jpa.repository.Lock(jakarta.persistence.LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM Post p WHERE p.id = :id AND p.deletedAt IS NULL")
    Optional<Post> findForUpdate(@Param("id") Long id);


    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Post p SET p.viewCount = p.viewCount + 1 WHERE p.id = :id")
    int incrementViews(@Param("id") Long id);

    @org.springframework.data.jpa.repository.Modifying
    @Query("UPDATE Post p SET p.likeCount = p.likeCount + :delta WHERE p.id = :id AND p.likeCount + :delta >= 0")
    int changeLikes(@Param("id") Long id, @Param("delta") int delta);

    Optional<Post> findBySlugAndDeletedAtIsNull(String slug);

    Optional<Post> findByIdAndDeletedAtIsNull(Long id);

    boolean existsBySlugAndDeletedAtIsNull(String slug);

    @Query("SELECT p FROM Post p WHERE p.deletedAt IS NULL AND p.status = :status AND p.visibility = 'PUBLIC' ORDER BY p.publishedAt DESC")
    Page<Post> findAllByStatusAndDeletedAtIsNull(@Param("status") PostStatus status, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.deletedAt IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' " +
           "AND (p.category.id = :categoryId OR :categoryId IS NULL) " +
           "ORDER BY p.publishedAt DESC")
    Page<Post> findPublishedByCategory(@Param("categoryId") Long categoryId, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.deletedAt IS NULL AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' " +
           "AND (LOWER(p.title) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(p.content) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Post> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT p FROM Post p JOIN p.tags t WHERE p.deletedAt IS NULL " +
           "AND p.status = 'PUBLISHED' AND p.visibility = 'PUBLIC' AND t.slug = :tagSlug")
    Page<Post> findPublishedByTag(@Param("tagSlug") String tagSlug, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.deletedAt IS NULL AND p.author.id = :authorId")
    Page<Post> findAllByAuthor(@Param("authorId") Long authorId, Pageable pageable);

    @Query("SELECT p FROM Post p WHERE p.deletedAt IS NULL AND p.author.id = :authorId AND p.status = :status")
    Page<Post> findAllByAuthorAndStatus(@Param("authorId") Long authorId, @Param("status") PostStatus status, Pageable pageable);
    @Query("SELECT p FROM Post p WHERE p.deletedAt IS NULL AND p.author.id = :authorId " +
           "AND (:status IS NULL OR p.status = :status) AND (:visibility IS NULL OR p.visibility = :visibility)")
    Page<Post> findOwnedWithFilters(@Param("authorId") Long authorId, @Param("status") PostStatus status,
                                   @Param("visibility") PostVisibility visibility, Pageable pageable);
}
