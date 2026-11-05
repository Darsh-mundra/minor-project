package com.example.StudyBuddy.Service.ServiceImpl;

import com.example.StudyBuddy.DTO.Request.QuizGenerateRequestDTO;
import com.example.StudyBuddy.DTO.Response.QuizHistoryItemDTO;
import com.example.StudyBuddy.DTO.Response.StudentResultSummaryDTO;
import com.example.StudyBuddy.Entity.QuizAttempt;
import com.example.StudyBuddy.Entity.QuizQuestion;
import com.example.StudyBuddy.Entity.User;
import com.example.StudyBuddy.Enum.QuizAttemptStatus;
import com.example.StudyBuddy.Enum.QuizDifficulty;
import com.example.StudyBuddy.Repository.QuizAttemptRepository;
import com.example.StudyBuddy.Repository.QuizQuestionRepository;
import com.example.StudyBuddy.Repository.UserRepository;
import com.example.StudyBuddy.Service.GeminiQuizService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class GeminiQuizServiceImpl implements GeminiQuizService {

    private final ObjectMapper objectMapper;
    private final QuizAttemptRepository quizAttemptRepository;
    private final QuizQuestionRepository quizQuestionRepository;
    private final UserRepository userRepository;
    private final ChatClient chatClient;

    public record GeneratedQuestion(
            String questionText,
            String optionA,
            String optionB,
            String optionC,
            String optionD,
            String correctOption,
            String explanation
    ) {}

    private String buildQuestionPrompt(String subject, String topic, String difficulty, int count) {
        return String.format(
                Locale.ROOT,
                """
                Generate exactly %d multiple-choice questions.
                Subject: %s
                Topic: %s
                Difficulty: %s

                Requirements:
                1. Questions must be relevant to the specified subject and topic.
                2. Each question must have exactly four distinct options.
                3. There must be exactly one correct answer.
                4. correctOption must be exactly A, B, C, or D.
                5. Include a clear, accurate explanation.
                6. Avoid duplicate questions.
                7. Return only valid JSON.

                Return a JSON array where each object contains:
                questionText, optionA, optionB, optionC, optionD, correctOption, explanation.
                """,
                count, subject, topic, difficulty
        );
    }

    @Override
    @Transactional
    public Object generateQuizQuestions(String email, QuizGenerateRequestDTO requestDTO) {
        if (requestDTO == null) {
            throw new IllegalArgumentException("Quiz request cannot be null.");
        }
        if (requestDTO.getSubject() == null || requestDTO.getSubject().isBlank()) {
            throw new IllegalArgumentException("Subject is required.");
        }
        if (requestDTO.getDifficulty() == null) {
            throw new IllegalArgumentException("Difficulty is required.");
        }
        if (requestDTO.getCount() < 1 || requestDTO.getCount() > 50) {
            throw new IllegalArgumentException("Question count must be between 1 and 50.");
        }

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found."));

        String subject = requestDTO.getSubject().trim();
        String topic = requestDTO.getTopic() == null || requestDTO.getTopic().isBlank() ? "General" : requestDTO.getTopic().trim();
        String difficulty = requestDTO.getDifficulty().toString().trim().toUpperCase(Locale.ROOT);
        int count = requestDTO.getCount();
        QuizDifficulty quizDifficulty = toQuizDifficulty(difficulty);

        // DIRECT AI GENERATION (Bypassing database bank checks and calling Groq directly)
        String prompt = buildQuestionPrompt(subject, topic, difficulty, count);
        List<GeneratedQuestion> questions;

        try {
            questions = generateFromGroq(prompt, count);
        } catch (Exception e) {
            log.error("Failed to generate quiz questions from Groq", e);
            throw new IllegalStateException("Failed to generate quiz questions from AI. Please try again.", e);
        }

        if (questions == null || questions.size() != count) {
            throw new IllegalStateException("The generated question count does not match the requested count.");
        }

        // Create the quiz attempt record
        QuizAttempt attempt = QuizAttempt.builder()
                .user(user)
                .subject(subject)
                .topic(topic)
                .difficulty(quizDifficulty)
                .questionCount(questions.size())
                .status(QuizAttemptStatus.IN_PROGRESS)
                .build();
        attempt = quizAttemptRepository.save(attempt);

        // Persist questions for this attempt
        List<QuizQuestion> quizQuestions = new ArrayList<>();
        for (int i = 0; i < questions.size(); i++) {
            GeneratedQuestion g = questions.get(i);
            quizQuestions.add(QuizQuestion.builder()
                    .quizAttempt(attempt)
                    .questionText(g.questionText())
                    .optionA(g.optionA())
                    .optionB(g.optionB())
                    .optionC(g.optionC())
                    .optionD(g.optionD())
                    .correctOption(g.correctOption())
                    .explanation(g.explanation())
                    .questionOrder(i + 1)
                    .build());
        }

        List<QuizQuestion> persisted = quizQuestionRepository.saveAll(quizQuestions);
        List responseQuestions = persisted.stream().map(this::toQuestionDTO).toList();

        Map<String, Object> response = new HashMap<>();
        response.put("attemptId", attempt.getId());
        response.put("subject", subject);
        response.put("topic", topic);
        response.put("difficulty", difficulty);
        response.put("questionCount", persisted.size());
        response.put("status", attempt.getStatus());
        response.put("questions", responseQuestions);

        return response;
    }

    private QuizDifficulty toQuizDifficulty(String difficulty) {
        String normalized = difficulty.toUpperCase(Locale.ROOT);
        for (QuizDifficulty value : QuizDifficulty.values()) {
            if (value.name().equals(normalized)) return value;
        }
        String alias = switch (normalized) {
            case "LOW" -> "EASY";
            case "EASY" -> "LOW";
            case "HIGH" -> "HARD";
            case "HARD" -> "HIGH";
            default -> normalized;
        };
        for (QuizDifficulty value : QuizDifficulty.values()) {
            if (value.name().equals(alias)) return value;
        }
        throw new IllegalArgumentException("Unsupported quiz difficulty: " + difficulty);
    }

    private boolean isValidQuestion(GeneratedQuestion q) {
        return q != null && q.questionText() != null && !q.questionText().isBlank()
                && q.optionA() != null && !q.optionA().isBlank()
                && q.optionB() != null && !q.optionB().isBlank()
                && q.optionC() != null && !q.optionC().isBlank()
                && q.optionD() != null && !q.optionD().isBlank()
                && q.correctOption() != null && !q.correctOption().isBlank()
                && q.explanation() != null && !q.explanation().isBlank();
    }

    private List<GeneratedQuestion> generateFromGroq(String prompt, int count) throws Exception {
        String aiResponse = chatClient.prompt().user(prompt).call().content();
        if (aiResponse == null || aiResponse.isBlank()) {
            throw new IllegalStateException("Groq returned an empty response.");
        }

        String cleanedJson = aiResponse.trim()
                .replaceFirst("(?is)^\\s*```(?:json)?\\s*", "")
                .replaceFirst("\\s*```\\s*$", "")
                .trim();

        JsonNode root = objectMapper.readTree(cleanedJson);
        JsonNode questionsNode = root.isArray() ? root : root.path("questions");

        if (!questionsNode.isArray()) {
            throw new IllegalStateException("Groq did not return a valid question array.");
        }

        return parseQuestions(objectMapper.writeValueAsString(questionsNode), count);
    }

    private List<GeneratedQuestion> parseQuestions(String jsonText, int count) throws Exception {
        JsonNode root = objectMapper.readTree(jsonText);
        List<GeneratedQuestion> questions = new ArrayList<>();

        for (JsonNode node : root) {
            String qText = node.path("questionText").asText("").trim();
            String optA = node.path("optionA").asText("").trim();
            String optB = node.path("optionB").asText("").trim();
            String optC = node.path("optionC").asText("").trim();
            String optD = node.path("optionD").asText("").trim();
            String correct = node.path("correctOption").asText("").trim().toUpperCase(Locale.ROOT);
            String explanation = node.path("explanation").asText("").trim();

            GeneratedQuestion g = new GeneratedQuestion(qText, optA, optB, optC, optD, correct, explanation);
            if (!isValidQuestion(g) || !List.of("A", "B", "C", "D").contains(correct)) {
                throw new IllegalStateException("AI returned an invalid question.");
            }
            questions.add(g);
        }

        if (questions.size() != count) {
            throw new IllegalStateException("Expected " + count + " questions, got " + questions.size());
        }
        return questions;
    }

    @Override
    @Transactional(readOnly = true)
    public QuizHistoryItemDTO getQuizHistoryById(String email, Long quizId) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("Authenticated user not found."));
        QuizAttempt attempt = quizAttemptRepository.findByIdAndUser(quizId, user).orElseThrow(() -> new IllegalArgumentException("Quiz history not found."));
        return mapToHistoryDTO(attempt);
    }

    private QuizHistoryItemDTO mapToHistoryDTO(QuizAttempt attempt) {
        return QuizHistoryItemDTO.builder()
                .attemptId(attempt.getId()).subject(attempt.getSubject()).topic(attempt.getTopic())
                .difficulty(attempt.getDifficulty()).questionCount(attempt.getQuestionCount())
                .status(attempt.getStatus()).score(attempt.getScore()).correctAnswers(attempt.getCorrectAnswers())
                .incorrectAnswers(attempt.getIncorrectAnswers()).unansweredQuestions(attempt.getUnansweredQuestions())
                .percentage(attempt.getPercentage()).startedAt(attempt.getStartedAt()).completedAt(attempt.getCompletedAt()).build();
    }

    private Map<String, Object> toQuestionDTO(QuizQuestion question) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("questionId", question.getId());
        dto.put("questionText", question.getQuestionText());
        dto.put("optionA", question.getOptionA());
        dto.put("optionB", question.getOptionB());
        dto.put("optionC", question.getOptionC());
        dto.put("optionD", question.getOptionD());
        dto.put("questionOrder", question.getQuestionOrder());
        return dto;
    }

    @Override
    @Transactional(readOnly = true)
    public Object getQuizQuestions(String email, Long quizId) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("Authenticated user not found."));
        QuizAttempt attempt = quizAttemptRepository.findByIdAndUser(quizId, user).orElseThrow(() -> new IllegalArgumentException("Quiz not found."));
        if (attempt.getStatus() == QuizAttemptStatus.GENERATING || attempt.getStatus() == QuizAttemptStatus.FAILED) {
            throw new IllegalArgumentException("Quiz is not available.");
        }
        List questions = quizQuestionRepository.findByQuizAttemptOrderByQuestionOrderAsc(attempt).stream().map(this::toQuestionDTO).toList();
        Map<String, Object> response = new HashMap<>();
        response.put("attemptId", attempt.getId());
        response.put("subject", attempt.getSubject());
        response.put("topic", attempt.getTopic());
        response.put("difficulty", attempt.getDifficulty());
        response.put("questionCount", attempt.getQuestionCount());
        response.put("status", attempt.getStatus());
        response.put("questions", questions);
        return response;
    }

    @Override
    @Transactional
    public Object submitQuiz(String email, Long quizId, Map<String, String> answers) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("Authenticated user not found."));
        QuizAttempt attempt = quizAttemptRepository.findByIdAndUser(quizId, user).orElseThrow(() -> new IllegalArgumentException("Quiz not found."));
        if (attempt.getStatus() != QuizAttemptStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("This quiz has already been submitted or is not available.");
        }
        if (answers == null) answers = Map.of();

        List<QuizQuestion> questions = quizQuestionRepository.findByQuizAttemptOrderByQuestionOrderAsc(attempt);
        int correct = 0, incorrect = 0, unanswered = 0;
        List breakdown = new ArrayList<>();

        for (QuizQuestion q : questions) {
            String selected = answers.get(String.valueOf(q.getId()));
            if (selected == null || selected.isBlank()) {
                selected = null;
                unanswered++;
            } else {
                selected = selected.trim().toUpperCase(Locale.ROOT);
                if (!List.of("A", "B", "C", "D").contains(selected)) {
                    throw new IllegalArgumentException("Invalid answer for question " + q.getId());
                }
                if (selected.equals(q.getCorrectOption().trim().toUpperCase(Locale.ROOT))) {
                    correct++;
                } else {
                    incorrect++;
                }
            }

            Map<String, Object> item = new HashMap<>();
            item.put("questionId", q.getId());
            item.put("questionText", q.getQuestionText());
            item.put("selectedOption", selected);
            item.put("correctOption", q.getCorrectOption());
            item.put("explanation", q.getExplanation());
            item.put("isCorrect", selected != null && selected.equalsIgnoreCase(q.getCorrectOption()));
            breakdown.add(item);
        }

        int total = questions.size();
        double percentage = total == 0 ? 0.0 : correct * 100.0 / total;

        attempt.setScore(correct);
        attempt.setCorrectAnswers(correct);
        attempt.setIncorrectAnswers(incorrect);
        attempt.setUnansweredQuestions(unanswered);
        attempt.setPercentage(Math.round(percentage * 100.0) / 100.0);
        attempt.setStatus(QuizAttemptStatus.SUBMITTED);
        attempt.setCompletedAt(LocalDateTime.now());
        quizAttemptRepository.save(attempt);

        Map<String, Object> result = new HashMap<>();
        result.put("attemptId", attempt.getId());
        result.put("score", correct);
        result.put("total", total);
        result.put("correctAnswers", correct);
        result.put("incorrectAnswers", incorrect);
        result.put("unansweredQuestions", unanswered);
        result.put("percentage", attempt.getPercentage());
        result.put("breakdown", breakdown);
        return result;
    }

    @Override
    @Transactional(readOnly = true)
    public List<QuizHistoryItemDTO> getQuizHistory(String email) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("Authenticated user not found."));
        return quizAttemptRepository.findByUserAndStatus(
                user, QuizAttemptStatus.SUBMITTED,
                org.springframework.data.domain.PageRequest.of(0, 100, org.springframework.data.domain.Sort.by(org.springframework.data.domain.Sort.Direction.DESC, "startedAt"))
        ).stream().map(this::mapToHistoryDTO).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public QuizHistoryItemDTO getStudentQuizResult(String email, Long attemptId) {
        User user = userRepository.findByEmail(email).orElseThrow(() -> new IllegalArgumentException("Authenticated user not found."));
        QuizAttempt attempt = quizAttemptRepository.findByIdAndUser(attemptId, user).orElseThrow(() -> new IllegalArgumentException("Quiz result not found."));
        return mapToHistoryDTO(attempt);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StudentResultSummaryDTO> getTeacherQuizResultsForTopic(String teacherEmail, String subject, String topic, QuizDifficulty difficulty) {
        userRepository.findByEmail(teacherEmail).orElseThrow(() -> new IllegalArgumentException("Teacher not found."));
        List<User> allStudents = userRepository.findAll().stream().filter(u -> u.getRole() != null && u.getRole().name().equalsIgnoreCase("STUDENT")).toList();
        List<QuizAttempt> attempts = quizAttemptRepository.findBySubjectIgnoreCaseAndTopicIgnoreCaseAndDifficultyOrderByStartedAtDesc(subject.trim(), topic.trim(), difficulty);

        Map<Long, QuizAttempt> studentAttemptMap = new HashMap<>();
        for (QuizAttempt attempt : attempts) {
            if (attempt.getUser() != null && attempt.getStatus() == QuizAttemptStatus.SUBMITTED) {
                studentAttemptMap.putIfAbsent(attempt.getUser().getId(), attempt);
            }
        }

        List<StudentResultSummaryDTO> scoreboard = new ArrayList<>();
        for (User student : allStudents) {
            QuizAttempt attempt = studentAttemptMap.get(student.getId());
            if (attempt != null) {
                scoreboard.add(StudentResultSummaryDTO.builder().userId(student.getId()).studentName(student.getName()).studentEmail(student.getEmail()).score(attempt.getScore()).totalQuestions(attempt.getQuestionCount()).percentage(attempt.getPercentage()).status(attempt.getStatus()).completedAt(attempt.getCompletedAt()).build());
            } else {
                scoreboard.add(StudentResultSummaryDTO.builder().userId(student.getId()).studentName(student.getName()).studentEmail(student.getEmail()).score(0).totalQuestions(0).percentage(0.0).status(QuizAttemptStatus.FAILED).completedAt(null).build());
            }
        }
        return scoreboard;
    }
}