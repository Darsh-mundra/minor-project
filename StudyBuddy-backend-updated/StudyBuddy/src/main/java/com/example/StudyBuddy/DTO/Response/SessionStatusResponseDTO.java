package com.example.StudyBuddy.DTO.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SessionStatusResponseDTO {
    private String status;         // e.g., "Active", "Unauthorized"
    private String sessionId;      // The HttpSession ID
    private UserSessionDTO user;   // The user details stored in the session
    private String message;        // Optional message
}