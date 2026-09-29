package com.portfolio.domain.blog.repository;

import com.portfolio.domain.blog.Attachment;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AttachmentRepository extends JpaRepository<Attachment, UUID> {
    List<Attachment> findAllByPostId(Long postId);
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Attachment a WHERE a.id = :id")
    Optional<Attachment> findForUpdate(@Param("id") UUID id);
}
