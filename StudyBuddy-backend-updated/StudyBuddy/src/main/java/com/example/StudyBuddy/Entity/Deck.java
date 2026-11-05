package com.example.StudyBuddy.Entity;

import com.example.StudyBuddy.Enum.Subject;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "decks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Deck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId; // Derived from authenticated principal securely

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Subject subject;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String syllabus;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "deck", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Flashcard> flashcards = new ArrayList<>();
}