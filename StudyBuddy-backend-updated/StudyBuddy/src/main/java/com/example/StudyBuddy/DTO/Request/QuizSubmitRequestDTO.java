package com.example.StudyBuddy.DTO.Request;

import jakarta.validation.constraints.NotNull;
import java.util.Map;
import lombok.Data;

@Data
public class QuizSubmitRequestDTO {
    @NotNull(message = "Answers map is required")
    private Map<Long, String> answers; // Key: questionId, Value: selectedOption ("A"/"B"/"C"/"D")
}