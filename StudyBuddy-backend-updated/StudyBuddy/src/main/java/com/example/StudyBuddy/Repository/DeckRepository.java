package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.Deck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeckRepository extends JpaRepository<Deck, Long> {
    List<Deck> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Deck> findByIdAndUserId(Long id, Long userId);
}