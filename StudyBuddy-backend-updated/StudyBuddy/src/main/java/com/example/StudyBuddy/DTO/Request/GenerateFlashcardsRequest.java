
package com.example.StudyBuddy.DTO.Request;

import com.example.StudyBuddy.Enum.FlashcardCount;
import com.example.StudyBuddy.Enum.Subject;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class GenerateFlashcardsRequest {

    @NotNull(message = "Subject is required")
    private Subject subject;

    @NotBlank(message = "Syllabus or topic content cannot be blank")
    @Size(max = 10000, message = "Syllabus or topic content cannot exceed 10000 characters")
    private String syllabus;

    @NotNull(message = "Flashcard count selection is required")
    private FlashcardCount numberOfFlashcards;
}
