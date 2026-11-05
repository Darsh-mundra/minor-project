
package com.example.StudyBuddy.Repository;

import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Projection.QuizAttemptAggregationProjection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface LeaderboardRepository extends JpaRepository<User, Long> {

    @Query(value = """
        SELECT
            u.id AS "userId",
            u.name AS "displayName",
            COUNT(qa.id) AS "totalCompletedQuizzes",
            COALESCE(SUM(qa.score), 0) AS "totalEarnedPoints",
            COALESCE(SUM(qa.question_count), 0) AS "totalPossiblePoints",
            COALESCE(SUM(qa.correct_answers), 0) AS "totalCorrectAnswers"
        FROM quiz_attempts qa
        JOIN users u ON u.id = qa.user_id
        WHERE qa.status = 'SUBMITTED'
          AND qa.completed_at IS NOT NULL
          AND (CAST(:startDate AS TIMESTAMP) IS NULL
               OR qa.completed_at >= CAST(:startDate AS TIMESTAMP))
          AND (CAST(:endDate AS TIMESTAMP) IS NULL
               OR qa.completed_at <= CAST(:endDate AS TIMESTAMP))
        GROUP BY u.id, u.name
        """, nativeQuery = true)
    List<QuizAttemptAggregationProjection> aggregateStudentPerformance(
            @Param("categoryId") Long categoryId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );
}
