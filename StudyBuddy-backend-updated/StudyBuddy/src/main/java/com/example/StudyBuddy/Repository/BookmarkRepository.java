package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.Bookmark;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BookmarkRepository extends JpaRepository<Bookmark, Long> {
    Optional<Bookmark> findByUserIdAndResourceId(Long userId, Long resourceId);
    boolean existsByUserIdAndResourceId(Long userId, Long resourceId);
    Page<Bookmark> findByUserId(Long userId, Pageable pageable);
}