package com.example.StudyBuddy.DTO.Response;

import com.example.StudyBuddy.Enum.RequestStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RequestResponseDTO {
    private Long requestId;
    private String title;
    private String subject;
    private String unit;
    private String detail;
    private String questionNeeded;
    private RequestStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private LocalDateTime fulfilledAt;
    private UserPublicResponseDTO creator;
}