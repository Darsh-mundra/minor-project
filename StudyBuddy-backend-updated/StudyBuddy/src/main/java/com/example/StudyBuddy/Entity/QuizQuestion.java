package com.example.StudyBuddy.Entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "quiz_questions", indexes = {
        @Index(name = "idx_question_attempt_id", columnList = "quiz_attempt_id")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "quiz_attempt_id", nullable = false)
    private QuizAttempt quizAttempt;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String questionText;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String optionA;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String optionB;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String optionC;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String optionD;

    @Column(nullable = false, length = 5)
    private String correctOption; // "A", "B", "C", or "D"

    @Column(nullable = false, columnDefinition = "TEXT")
    private String explanation;

    @Column(nullable = false)
    private Integer questionOrder;
}