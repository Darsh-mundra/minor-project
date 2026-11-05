package com.example.StudyBuddy.Utility;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class AIService {

    private static final Logger log = LoggerFactory.getLogger(AIService.class);
    private final ChatClient chatClient;

    public AIService(ChatClient chatClient) {
        this.chatClient = chatClient;
    }

    /**
     * Sends a prompt and returns a plain text response (ideal for Study Assistant).
     */
    public String generateText(String prompt) {
        try {
            return chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("Error generating AI text response from Groq: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate AI response. Please try again later.", e);
        }
    }

    /**
     * Sends a prompt with custom system instructions or context and returns text.
     */
    public String generateTextWithContext(String systemContext, String prompt) {
        try {
            return chatClient.prompt()
                    .system(systemContext)
                    .user(prompt)
                    .call()
                    .content();
        } catch (Exception e) {
            log.error("Error generating AI text response with context: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate AI response. Please try again later.", e);
        }
    }

    /**
     * Sends a prompt and maps the JSON response directly to a target DTO class
     * (ideal for Quiz and Flashcard generators).
     */
    public <T> T generateStructured(String prompt, Class<T> targetType) {
        try {
            return chatClient.prompt()
                    .user(prompt)
                    .call()
                    .entity(targetType);
        } catch (Exception e) {
            log.error("Error generating structured AI response for type {}: {}", targetType.getSimpleName(), e.getMessage(), e);
            throw new RuntimeException("Failed to generate structured content. Please check your topic or try again.", e);
        }
    }
}