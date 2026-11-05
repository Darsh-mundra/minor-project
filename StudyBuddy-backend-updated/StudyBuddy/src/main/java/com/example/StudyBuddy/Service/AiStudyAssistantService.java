package com.example.StudyBuddy.Service;

import com.example.StudyBuddy.DTO.Response.MessageResponseDto;
import com.example.StudyBuddy.Entity.Conversation;
import com.example.StudyBuddy.Entity.User;

import java.util.List;

public interface AiStudyAssistantService {

    Conversation createConversation(User user);

    List<Conversation> getUserConversations(User user);

    List<MessageResponseDto> getConversationMessages(Long conversationId, User user);

    MessageResponseDto processMessage(Long conversationId, String userMessageText, User user);
}