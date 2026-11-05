package com.example.StudyBuddy.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FulfillmentResponseDTO {
    private Long fulfillmentId;
    private Long requestId;
    private UserPublicResponseDTO fulfilledBy;
    private String fulfillmentDetail;
    private String answerOrResource;
    private LocalDateTime createdAt;
}