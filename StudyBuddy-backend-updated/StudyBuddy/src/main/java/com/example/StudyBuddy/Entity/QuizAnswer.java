package com.example.StudyBuddy.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "quiz_answers", indexes = {
        @Index(name = "idx_answer_attempt_id", columnList = "quiz_attempt_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_attempt_id", nullable = false)
    private QuizAttempt quizAttempt;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_question_id", nullable = false)
    private QuizQuestion quizQuestion;

    @Column(length = 5)
    private String selectedOption; // "A", "B", "C", "D" or null if unanswered

    @Column(nullable = false)
    private Boolean isCorrect;
}