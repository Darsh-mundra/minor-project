package com.example.StudyBuddy.Entity;

import com.example.StudyBuddy.Enum.QuizDifficulty;
import com.example.StudyBuddy.Enum.QuizAttemptStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_attempts", indexes = {
        @Index(name = "idx_quiz_user_id", columnList = "user_id"),
        @Index(name = "idx_quiz_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String subject;

    @Column(nullable = false, length = 100)
    private String topic;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private QuizDifficulty difficulty;

    @Column(nullable = false)
    private Integer questionCount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private @Builder.Default QuizAttemptStatus status = QuizAttemptStatus.GENERATING;

    private Integer score;
    private Integer correctAnswers;
    private Integer incorrectAnswers;
    private Integer unansweredQuestions;
    private Double percentage;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime startedAt;

    private LocalDateTime completedAt;
}