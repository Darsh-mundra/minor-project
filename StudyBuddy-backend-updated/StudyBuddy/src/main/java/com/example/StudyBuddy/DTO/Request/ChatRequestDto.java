package com.example.StudyBuddy.DTO.Request;

import jakarta.validation.constraints.NotBlank;

public class ChatRequestDto {
    @NotBlank(message = "Message content cannot be blank")
    private String message;

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}