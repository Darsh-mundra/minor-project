package com.example.StudyBuddy.Service.ServiceImpl;

import com.example.StudyBuddy.DTO.Response.MessageResponseDto;
import com.example.StudyBuddy.Entity.Conversation;
import com.example.StudyBuddy.Entity.Message;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Repository.ConversationRepository;
import com.example.StudyBuddy.Repository.MessageRepository;
import com.example.StudyBuddy.Service.AiStudyAssistantService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.List;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AiStudyAssistantServiceImpl implements AiStudyAssistantService {

    private final ConversationRepository conversationRepository;
    private final MessageRepository messageRepository;
    private final ChatClient chatClient;

    private static final Pattern GREETING_PATTERN = Pattern.compile(
            "^(hi|hello|hey|good morning|good afternoon|good evening|greetings)[\\s!]*$", Pattern.CASE_INSENSITIVE
    );

    private static final List<String> ACADEMIC_KEYWORDS = Arrays.asList(
            "java", "spring", "boot", "sql", "dbms", "dsa", "algorithm", "data structure",
            "operating system", "os", "network", "computer science", "code", "programming",
            "exam", "revision", "schedule", "viva", "interview", "formula", "study", "notes",
            "homework", "assignment", "theorem", "complexity", "database", "api", "backend",
            "frontend", "react", "html", "css", "javascript", "postgres", "kafka", "redis"
    );

    @Transactional
    public Conversation createConversation(User user) {
        Conversation conversation = new Conversation();
        conversation.setUser(user);
        conversation.setTitle("New Study Session");
        return conversationRepository.save(conversation);
    }

    @Transactional(readOnly = true)
    public List<Conversation> getUserConversations(User user) {
        return conversationRepository.findByUserOrderByUpdatedAtDesc(user);
    }

    @Transactional(readOnly = true)
    public List<MessageResponseDto> getConversationMessages(Long conversationId, User user) {
        Conversation conversation = conversationRepository.findByIdAndUser(conversationId, user)
                .orElseThrow(() -> new RuntimeException("Conversation not found or unauthorized"));

        return messageRepository.findByConversationIdOrderByTimestampAsc(conversation.getId())
                .stream()
                .map(m -> new MessageResponseDto(m.getId(), m.getSender().name(), m.getContent(), m.getTimestamp()))
                .collect(Collectors.toList());
    }

    @Transactional
    public MessageResponseDto processMessage(Long conversationId, String userMessageText, User user) {
        Conversation conversation = conversationRepository.findByIdAndUser(conversationId, user)
                .orElseThrow(() -> new RuntimeException("Conversation not found or unauthorized"));

        // Save user message
        Message userMessage = new Message();
        userMessage.setConversation(conversation);
        userMessage.setSender(Message.SenderType.USER);
        userMessage.setContent(userMessageText);
        messageRepository.save(userMessage);

        // Update conversation title if it's the first exchange
        if (conversation.getTitle().equals("New Study Session")) {
            String shortTitle = userMessageText.length() > 30 ? userMessageText.substring(0, 27) + "..." : userMessageText;
            conversation.setTitle(shortTitle);
        }

        String assistantReply;

        // 1. Handle Greetings without calling AI
        if (GREETING_PATTERN.matcher(userMessageText.trim()).matches()) {
            String userName = (user.getName() != null && !user.getName().isEmpty()) ? user.getName() : "Student";
            assistantReply = String.format(
                    "Hello %s! I am your Study Buddy academic study mentor.\n\n" +
                            "I can help you:\n" +
                            "1. Break down complex algorithms and syllabus theorems step-by-step.\n" +
                            "2. Formulate 5-day structured exam revision schedules.\n" +
                            "3. Summarize dense lecture units into high-yield formula sheets.\n" +
                            "4. Prepare you for tough viva-voce and interview questions.\n\n" +
                            "What subject or concept are we diving into today?",
                    userName
            );
        }
        // 2. Validate Study Scope
        else if (!isStudyRelated(userMessageText)) {
            assistantReply = "I am your StudyBuddy AI assistant. I can help you with academic learning, educational topics, programming, and concept explanations. Please ask an education-related question.";
        }
        // 3. Query Groq via Spring AI ChatClient with conversational history context
        else {
            assistantReply = callGroqChat(conversation.getId(), userMessageText);
        }

        // Save assistant response
        Message assistantMessage = new Message();
        assistantMessage.setConversation(conversation);
        assistantMessage.setSender(Message.SenderType.ASSISTANT);
        assistantMessage.setContent(assistantReply);
        messageRepository.save(assistantMessage);

        conversationRepository.save(conversation);

        return new MessageResponseDto(assistantMessage.getId(), assistantMessage.getSender().name(), assistantMessage.getContent(), assistantMessage.getTimestamp());
    }

    private boolean isStudyRelated(String text) {
        String lower = text.toLowerCase();
        if (lower.matches("^(thanks|thank you|ok|okay|got it|understands|cool|yes|no)[\\s!]*$")) {
            return true;
        }
        return ACADEMIC_KEYWORDS.stream().anyMatch(lower::contains);
    }

    private String callGroqChat(Long conversationId, String currentMessage) {
        try {
            // Retrieve recent messages for context
            List<Message> pastMessages = messageRepository.findByConversationIdOrderByTimestampAsc(conversationId);
            int startIndex = Math.max(0, pastMessages.size() - 9);
            List<Message> contextMessages = pastMessages.subList(startIndex, pastMessages.size());

            StringBuilder historyBuilder = new StringBuilder();
            for (Message m : contextMessages) {
                String role = (m.getSender() == Message.SenderType.USER) ? "User" : "Assistant";
                historyBuilder.append(role).append(": ").append(m.getContent()).append("\n");
            }

            String prompt = "Conversation History:\n" + historyBuilder.toString() + "\nRespond to the latest user prompt maintaining academic context.";

            long startTime = System.currentTimeMillis();
            String response = chatClient.prompt()
                    .user(prompt)
                    .call()
                    .content();

            log.info("Groq Study Assistant response time: {} ms", (System.currentTimeMillis() - startTime));
            return response != null ? response : "I'm sorry, I couldn't generate a response at the moment. Please try again.";
        } catch (Exception e) {
            log.error("Error communicating with Groq via Spring AI: {}", e.getMessage(), e);
            return "An error occurred while communicating with the AI service. Please try again later.";
        }
    }
}