package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.QuizQuestionBank;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizQuestionBankRepository
        extends JpaRepository<QuizQuestionBank, Long> {

    @Query(value = """
            SELECT *
            FROM quiz_question_bank
            WHERE LOWER(subject) = LOWER(:subject)
              AND LOWER(topic) = LOWER(:topic)
              AND UPPER(difficulty) = UPPER(:difficulty)
            ORDER BY RANDOM()
            LIMIT :count
            """, nativeQuery = true)
    List<QuizQuestionBank> findRandomQuestions(
            @Param("subject") String subject,
            @Param("topic") String topic,
            @Param("difficulty") String difficulty,
            @Param("count") int count
    );

    long countBySubjectIgnoreCaseAndTopicIgnoreCaseAndDifficultyIgnoreCase(
            String subject,
            String topic,
            String difficulty
    );

    boolean existsBySubjectIgnoreCaseAndTopicIgnoreCaseAndDifficultyIgnoreCaseAndQuestionTextIgnoreCase(
            String subject,
            String topic,
            String difficulty,
            String questionText
    );
}
