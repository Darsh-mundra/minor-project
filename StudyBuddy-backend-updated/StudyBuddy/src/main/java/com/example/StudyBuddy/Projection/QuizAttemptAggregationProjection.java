package com.example.StudyBuddy.Projection;

public interface QuizAttemptAggregationProjection {
    Long getUserId();
    String getDisplayName();
    Long getTotalCompletedQuizzes();
    Double getTotalEarnedPoints();
    Double getTotalPossiblePoints();
    Long getTotalCorrectAnswers();
}