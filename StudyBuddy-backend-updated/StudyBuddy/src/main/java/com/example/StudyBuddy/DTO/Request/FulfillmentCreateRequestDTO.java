package com.example.StudyBuddy.DTO.Request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class FulfillmentCreateRequestDTO {
    @NotBlank(message = "Fulfillment detail is required")
    private String fulfillmentDetail;
    private String answerOrResource;
}