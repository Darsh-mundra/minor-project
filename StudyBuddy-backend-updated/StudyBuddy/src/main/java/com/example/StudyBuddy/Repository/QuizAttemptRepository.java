package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.QuizAttempt;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Enum.QuizAttemptStatus;
import com.example.StudyBuddy.Enum.QuizDifficulty;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, Long>, JpaSpecificationExecutor<QuizAttempt> {
    Page<QuizAttempt> findByUser(User user, Pageable pageable);
    Page<QuizAttempt> findByUserAndSubjectContainingIgnoreCaseAndDifficulty(
            User user, String subject, QuizDifficulty difficulty, Pageable pageable);
    Page<QuizAttempt> findByUserAndSubjectContainingIgnoreCase(
            User user, String subject, Pageable pageable);
    Page<QuizAttempt> findByUserAndDifficulty(
            User user, QuizDifficulty difficulty, Pageable pageable);
    Optional<QuizAttempt> findByIdAndUser(Long id, User user);
    List<QuizAttempt> findByUserAndStatus(User user, QuizAttemptStatus status, org.springframework.data.domain.Pageable pageable);
    List<QuizAttempt> findBySubjectIgnoreCaseAndTopicIgnoreCaseAndDifficultyOrderByStartedAtDesc(
            String subject,
            String topic,
            QuizDifficulty difficulty
    );
}