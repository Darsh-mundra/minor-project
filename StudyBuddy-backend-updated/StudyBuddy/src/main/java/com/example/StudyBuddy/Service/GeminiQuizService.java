package com.example.StudyBuddy.Service;

import com.example.StudyBuddy.DTO.Request.QuizGenerateRequestDTO;
import com.example.StudyBuddy.DTO.Response.QuizHistoryItemDTO;
import com.example.StudyBuddy.DTO.Response.StudentResultSummaryDTO;
import com.example.StudyBuddy.Enum.QuizDifficulty;
import com.example.StudyBuddy.Service.ServiceImpl.GeminiQuizServiceImpl;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

public interface GeminiQuizService {

    Object generateQuizQuestions(
            String email,
            QuizGenerateRequestDTO requestDTO
    );

    List<QuizHistoryItemDTO> getQuizHistory(String email);

    QuizHistoryItemDTO getQuizHistoryById(String email, Long quizId);

    Object getQuizQuestions(String email, Long quizId);

    Object submitQuiz(
            String email,
            Long quizId,
            Map<String, String> answers
    );

    QuizHistoryItemDTO getStudentQuizResult(String email, Long attemptId);

    List<StudentResultSummaryDTO> getTeacherQuizResultsForTopic(
            String teacherEmail,
            String subject,
            String topic,
            QuizDifficulty difficulty
    );
}