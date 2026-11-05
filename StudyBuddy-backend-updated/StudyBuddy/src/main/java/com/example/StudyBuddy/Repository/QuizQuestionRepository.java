package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.QuizAttempt;
import com.example.StudyBuddy.Entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Long> {

    List<QuizQuestion> findByQuizAttemptOrderByQuestionOrderAsc(QuizAttempt quizAttempt);

}
