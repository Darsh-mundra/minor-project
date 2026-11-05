package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Long> {
    // Additional custom query methods if needed
}