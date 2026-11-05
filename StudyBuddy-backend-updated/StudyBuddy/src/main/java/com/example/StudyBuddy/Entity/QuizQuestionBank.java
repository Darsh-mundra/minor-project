package com.example.StudyBuddy.Entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "quiz_question_bank",
        indexes = {
                @Index(
                        name = "idx_quiz_bank_lookup",
                        columnList = "subject, topic, difficulty"
                )
        }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestionBank {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String subject;

    @Builder.Default
    @Column(nullable = false, length = 100)
    private String topic = "General";

    @Column(nullable = false, length = 20)
    private String difficulty;

    @Column(
            name = "question_text",
            nullable = false,
            columnDefinition = "TEXT"
    )
    private String questionText;

    @Column(
            name = "option_a",
            nullable = false,
            columnDefinition = "TEXT"
    )
    private String optionA;

    @Column(
            name = "option_b",
            nullable = false,
            columnDefinition = "TEXT"
    )
    private String optionB;

    @Column(
            name = "option_c",
            nullable = false,
            columnDefinition = "TEXT"
    )
    private String optionC;

    @Column(
            name = "option_d",
            nullable = false,
            columnDefinition = "TEXT"
    )
    private String optionD;

    @Column(name = "correct_option", nullable = false, length = 1)
    private String correctOption;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String explanation;

    @Builder.Default
    @Column(
            name = "created_at",
            nullable = false,
            updatable = false
    )
    private LocalDateTime createdAt = LocalDateTime.now();

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
