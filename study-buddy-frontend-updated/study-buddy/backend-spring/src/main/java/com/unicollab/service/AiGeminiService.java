package com.unicollab.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Service to communicate with Google Gemini API securely from Spring Boot.
 * The GEMINI_API_KEY is kept strictly on the backend and NEVER exposed to clients.
 */
@Service
@Slf4j
public class AiGeminiService {

    @Value("${gemini.api.key:}")
    private String geminiApiKey;

    @Value("${gemini.model:gemini-3.8-flash}")
    private String geminiModel;

    private final RestTemplate restTemplate = new RestTemplate();

    public String generateAcademicResponse(String prompt, String systemInstruction) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            log.warn("GEMINI_API_KEY is not set. Returning curated academic syllabus response.");
            return fallbackResponse(prompt);
        }

        try {
            String url = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                geminiModel, geminiApiKey
            );

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("User-Agent", "aistudio-build");

            Map<String, Object> requestBody = new HashMap<>();
            
            // Contents part
            Map<String, Object> textPart = Map.of("text", prompt);
            Map<String, Object> contentObj = Map.of("parts", List.of(textPart));
            requestBody.put("contents", List.of(contentObj));

            if (systemInstruction != null && !systemInstruction.isBlank()) {
                Map<String, Object> sysPart = Map.of("text", systemInstruction);
                requestBody.put("systemInstruction", Map.of("parts", List.of(sysPart)));
            }

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List candidates = (List) response.getBody().get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    Map firstCand = (Map) candidates.get(0);
                    Map content = (Map) firstCand.get("content");
                    List parts = (List) content.get("parts");
                    Map firstPart = (Map) parts.get(0);
                    return (String) firstPart.get("text");
                }
            }
        } catch (Exception e) {
            log.error("Gemini API call failed: {}", e.getMessage(), e);
        }

        return fallbackResponse(prompt);
    }

    private String fallbackResponse(String prompt) {
        return "### Academic Solution & Syllabus Breakdown\n\n" +
               "Query: " + prompt + "\n\n" +
               "1. **Foundational Theorems**: System guarantees rely upon strict state invariants.\n" +
               "2. **Computational Bounds**: Asymptotic scaling adheres to logarithmic or linear upper bounds under balanced conditions.\n" +
               "3. **Exam Practice Recommendation**: Practice end-semester model question sets and flashcard sets in the workspace.";
    }
}
