package com.example.StudyBuddy.DTO.Request;

import com.example.StudyBuddy.Enum.QuizDifficulty;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class QuizGenerateRequestDTO {

    @NotBlank(message = "Subject is required")
    @Size(max = 100)
    private String subject;

    @NotBlank(message = "Topic is required")
    @Size(max = 100)
    private String topic;

    @NotNull(message = "Difficulty is required")
    private QuizDifficulty difficulty;

    @NotNull(message = "Question count is required")
    @Min(value = 5, message = "Question count must be at least 5")
    @Max(value = 20, message = "Question count cannot exceed 20")
    private Integer questionCount;

    public int getCount() {
        return questionCount;
    }
}