package com.portfolio.domain.blog.repository;

import com.portfolio.domain.blog.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {

    Optional<Tag> findBySlug(String slug);

    List<Tag> findByIdIn(List<Long> ids);

    boolean existsByName(String name);

    boolean existsBySlug(String slug);
}
