package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface FlashcardRepository extends JpaRepository<Flashcard, Long> {
    Optional<Flashcard> findByIdAndDeckUserId(Long id, Long userId);
}