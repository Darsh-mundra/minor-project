package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.QuizAnswer;
import com.example.StudyBuddy.Entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizAnswerRepository extends JpaRepository<QuizAnswer, Long> {
    List<QuizAnswer> findByQuizAttempt(QuizAttempt quizAttempt);
}