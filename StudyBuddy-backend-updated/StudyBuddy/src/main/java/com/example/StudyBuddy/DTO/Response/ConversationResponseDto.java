
package com.example.StudyBuddy.DTO.Response;

import com.example.StudyBuddy.Entity.Conversation;
import java.time.LocalDateTime;

public record ConversationResponseDto(
        Long id,
        String title,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ConversationResponseDto from(Conversation conversation) {
        return new ConversationResponseDto(
                conversation.getId(),
                conversation.getTitle(),
                conversation.getCreatedAt(),
                conversation.getUpdatedAt()
        );
    }
}

