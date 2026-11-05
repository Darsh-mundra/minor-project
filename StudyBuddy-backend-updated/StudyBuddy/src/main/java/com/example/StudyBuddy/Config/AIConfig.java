package com.example.StudyBuddy.Config;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AIConfig {

    private static final String ACADEMIC_SYSTEM_PROMPT =
            "You are StudyBuddy AI, an expert academic assistant. Your sole purpose is to help students learn educational subjects " +
                    "such as Programming, Computer Science, Mathematics, Physics, Chemistry, Biology, Data Structures, Algorithms, Databases, " +
                    "Operating Systems, Computer Networks, and Language Learning.";

    @Bean
    public ChatClient chatClient(ChatClient.Builder builder) {
        return builder
                .defaultSystem(ACADEMIC_SYSTEM_PROMPT)
                .build();
    }
}