package com.example.StudyBuddy.DTO.Response;

import java.time.LocalDateTime;

public class MessageResponseDto {
    private Long id;
    private String sender;
    private String content;
    private LocalDateTime timestamp;

    public MessageResponseDto(Long id, String sender, String content, LocalDateTime timestamp) {
        this.id = id;
        this.sender = sender;
        this.content = content;
        this.timestamp = timestamp;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public String getSender() { return sender; }
    public String getContent() { return content; }
    public LocalDateTime getNTimestamp() { return timestamp; }
}
