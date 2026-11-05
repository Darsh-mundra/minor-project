import React, { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import {
  Sparkles,
  CheckCircle2,
  XCircle,
  Trophy,
  RotateCcw,
} from 'lucide-react';

interface QuizQuestion {
  questionId: string;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  questionOrder: number;
}

interface Quiz {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: string;
  questions: QuizQuestion[];
}

interface QuizAttempt {
  attemptId: number;
  subject: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  status: string;
  score: number | null;
  correctAnswers: number | null;
  incorrectAnswers: number | null;
  unansweredQuestions: number | null;
  percentage: number | null;
  startedAt: string;
  completedAt: string | null;
}

interface QuizHubProps {
  initialQuizId?: string;
}

const toQuiz = (data: any): Quiz => ({
  id: String(data.attemptId ?? data.id),
  title: data.title ?? data.topic ?? 'AI Generated Quiz',
  subject: data.subject,
  topic: data.topic,
  difficulty: String(data.difficulty ?? '').toUpperCase(),
  questions: (data.questions ?? []).map((q: any, index: number) => ({
    questionId: String(q.questionId ?? q.id),
    questionText: q.questionText,
    optionA: q.optionA,
    optionB: q.optionB,
    optionC: q.optionC,
    optionD: q.optionD,
    questionOrder: q.questionOrder ?? index + 1,
  })),
});

const toOptionLabel = (option: string) => {
  switch (option) {
    case 'A': return 'optionA';
    case 'B': return 'optionB';
    case 'C': return 'optionC';
    case 'D': return 'optionD';
    default: return '';
  }
};

export const QuizHub: React.FC<QuizHubProps> = ({ initialQuizId }) => {
  const { addToast } = useToast();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [myAttempts, setMyAttempts] = useState<QuizAttempt[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);

  const [isGenModalOpen, setIsGenModalOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const [genForm, setGenForm] = useState({
    subject: 'Database Management Systems',
    topic: 'ACID Properties & Concurrency Control',
    difficulty: 'EASY',
    questionCount: 5,
  });

  const loadQuizzesAndAttempts = async () => {
    setIsLoading(true);

    try {
      const history = await api.getMyQuizAttempts();
      setMyAttempts(history);

      // Active / in-progress quizzes available to take
      const activeOrReady = history.filter(
        (item: QuizAttempt) => item.status === 'IN_PROGRESS' || item.status === 'GENERATING'
      );

      setQuizzes(activeOrReady.map((item: any) => toQuiz(item)));

      if (initialQuizId) {
        const target = history.find(
          (item: QuizAttempt) => String(item.attemptId) === String(initialQuizId)
        );

        if (target) {
          await startQuiz(toQuiz(target));
        }
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error loading quizzes',
        message: err.message ?? 'Could not load quiz history.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadQuizzesAndAttempts();
  }, [initialQuizId]);

  const handleGenerateQuiz = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);

    try {
      const response = await api.generateAiQuiz(genForm);
      const generatedQuiz = toQuiz(response);

      setIsGenModalOpen(false);

      addToast({
        type: 'success',
        title: 'AI Quiz Generated!',
        message: `Generated ${generatedQuiz.questions.length} questions for ${generatedQuiz.topic}.`,
      });

      await loadQuizzesAndAttempts();
      await startQuiz(generatedQuiz);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Quiz generation failed',
        message: err.message ?? 'Could not generate the quiz.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReviewAttempt = async (attempt: QuizAttempt) => {
    try {
      // Fetch the questions and details for this specific attempt
      const response = await api.getQuizById(String(attempt.attemptId));
      const loadedQuiz = toQuiz(response);
      setActiveQuiz(loadedQuiz);
      
      // If it's already submitted, we can load previous results or let them view questions
      if (attempt.status === 'SUBMITTED') {
        setQuizResult({
          attemptId: attempt.attemptId,
          score: attempt.score,
          total: attempt.questionCount,
          percentage: attempt.percentage,
          breakdown: [] // Will display basic summary
        });
      } else {
        setQuizResult(null);
      }
      setUserAnswers({});
      setCurrentQuestionIndex(0);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Unable to open review',
        message: err.message ?? 'Could not load quiz details.',
      });
    }
  };
  
  const startQuiz = async (quiz: Quiz) => {
    try {
      const response = await api.getQuizById(quiz.id);
      const loadedQuiz = toQuiz(response);

      setActiveQuiz(loadedQuiz);
      setUserAnswers({});
      setCurrentQuestionIndex(0);
      setQuizResult(null);
    } catch (err: any) {
      // A newly generated quiz already contains its questions.
      if (quiz.questions.length > 0) {
        setActiveQuiz(quiz);
        setUserAnswers({});
        setCurrentQuestionIndex(0);
        setQuizResult(null);
        return;
      }

      addToast({
        type: 'error',
        title: 'Unable to open quiz',
        message: err.message ?? 'Could not load quiz questions.',
      });
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    setUserAnswers(prev => ({
      ...prev,
      [questionId]: option,
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await api.submitQuiz(activeQuiz.id, userAnswers);

      setQuizResult(result);

      addToast({
        type: 'success',
        title: 'Quiz Submitted!',
        message: `You scored ${result.percentage}% (${result.score}/${result.total}).`,
      });

      const updatedAttempts = await api.getMyQuizAttempts();
      setMyAttempts(updatedAttempts);
      setQuizzes(
        updatedAttempts
          .filter((item: QuizAttempt) =>
            item.status === 'IN_PROGRESS' || item.status === 'SUBMITTED'
          )
          .map((item: any) => toQuiz(item))
      );
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Submission error',
        message: err.message ?? 'Could not submit quiz.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentQuestion = activeQuiz?.questions[currentQuestionIndex];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            AI Quiz Generator & Assessment
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Generate quizzes using Gemini and track your performance.
          </p>
        </div>

        <button
          onClick={() => setIsGenModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 inline-flex items-center gap-1.5"
        >
          <Sparkles className="w-4 h-4" />
          Generate Custom Quiz
        </button>
      </div>

      {activeQuiz && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold text-indigo-700 uppercase">
                {activeQuiz.subject} · {activeQuiz.difficulty}
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">
                {activeQuiz.title}
              </h2>
            </div>

            <button
              onClick={() => setActiveQuiz(null)}
              className="text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Exit Quiz
            </button>
          </div>

          {!quizResult ? (
            currentQuestion ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>
                    Question {currentQuestionIndex + 1} of {activeQuiz.questions.length}
                  </span>
                  <span>
                    Answered: {Object.keys(userAnswers).length} / {activeQuiz.questions.length}
                  </span>
                </div>

                <p className="text-sm sm:text-base font-bold text-slate-900">
                  {currentQuestion.questionText}
                </p>

                <div className="space-y-2.5">
                  {(['A', 'B', 'C', 'D'] as const).map(option => {
                    const optionKey = toOptionLabel(option) as
                      | 'optionA'
                      | 'optionB'
                      | 'optionC'
                      | 'optionD';

                    const selected =
                      userAnswers[currentQuestion.questionId] === option;

                    return (
                      <button
                        type="button"
                        key={option}
                        onClick={() =>
                          handleSelectOption(currentQuestion.questionId, option)
                        }
                        className={`w-full p-3.5 rounded-xl border text-left text-xs sm:text-sm flex items-center justify-between gap-3 ${
                          selected
                            ? 'border-indigo-600 bg-indigo-50 font-bold text-indigo-950'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <span>{currentQuestion[optionKey]}</span>
                        <span className="shrink-0 font-bold">{option}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                  <button
                    onClick={() =>
                      setCurrentQuestionIndex(index => Math.max(0, index - 1))
                    }
                    disabled={currentQuestionIndex === 0}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 rounded-lg disabled:opacity-40"
                  >
                    Previous
                  </button>

                  {currentQuestionIndex < activeQuiz.questions.length - 1 ? (
                    <button
                      onClick={() =>
                        setCurrentQuestionIndex(index => index + 1)
                      }
                      className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={isSubmitting}
                      className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 rounded-lg disabled:opacity-50"
                    >
                      {isSubmitting ? 'Evaluating...' : 'Submit Answers'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">No questions found for this quiz.</p>
            )
          ) : (
            <div className="space-y-6">
              <div className="p-6 rounded-xl bg-slate-50 border text-center space-y-2">
                <Trophy className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="text-xl font-extrabold text-slate-900">
                  You Scored {quizResult.percentage}%
                </h3>
                <p className="text-xs text-slate-500">
                  {quizResult.score} of {quizResult.total} questions correct.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase text-slate-700">
                  Explanations & Solutions
                </h4>

                {(quizResult.breakdown ?? []).map((item: any) => (
                  <div
                    key={item.questionId}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      item.isCorrect
                        ? 'bg-emerald-50/50 border-emerald-200'
                        : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {item.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <p className="font-bold text-slate-900">
                        {item.questionText}
                      </p>
                    </div>

                    <div className="pl-6 space-y-1 text-slate-600">
                      <p>
                        <span className="font-semibold">Your answer:</span>{' '}
                        {item.selectedOption ?? 'Not answered'}
                      </p>
                      <p>
                        <span className="font-semibold">Correct answer:</span>{' '}
                        {item.correctOption}
                      </p>
                      <p className="bg-white p-2.5 rounded-lg mt-2">
                        <span className="font-semibold text-indigo-700">
                          Explanation:
                        </span>{' '}
                        {item.explanation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => startQuiz(activeQuiz)}
                  className="px-4 py-2 text-xs font-semibold border rounded-lg inline-flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retake Quiz
                </button>
                <button
                  onClick={() => setActiveQuiz(null)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
                >
                  Back to Quiz List
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <section className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">
          My Quizzes ({quizzes.length})
        </h2>

        {isLoading ? (
          <div className="p-6 text-sm text-slate-500">Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <EmptyState
            title="No quizzes yet"
            description="Generate your first AI quiz to get started."
            actionText="Generate AI Quiz"
            onAction={() => setIsGenModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {quizzes.map(quiz => {
              const attempt = myAttempts.find(
                item => String(item.attemptId) === quiz.id
              );

              return (
                <div
                  key={quiz.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-bold text-indigo-700">
                        {quiz.subject}
                      </span>
                      <span>{quiz.difficulty}</span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-2">
                      {quiz.topic}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {attempt?.questionCount ?? quiz.questions.length} questions
                    </p>
                    {attempt?.status === 'SUBMITTED' && (
                      <p className="text-xs text-emerald-700 mt-2">
                        Score: {attempt.percentage ?? 0}%
                      </p>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {attempt?.status ?? 'IN_PROGRESS'}
                    </span>
                    <button
                      onClick={() => startQuiz(quiz)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg"
                    >
                      {attempt?.status === 'SUBMITTED' ? 'Review Quiz' : 'Start Quiz'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="space-y-4 pt-4 border-t border-slate-200">
        <h2 className="text-base font-bold text-slate-900">
          My Quiz Performance History
        </h2>

        {myAttempts.length === 0 ? (
          <p className="text-xs text-slate-500">No quiz attempts recorded yet.</p>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {myAttempts.map(attempt => (
              <div
                key={attempt.attemptId}
                className="p-4 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <h4 className="font-bold text-slate-900">
                    {attempt.subject} · {attempt.topic}
                  </h4>
                  <p className="text-slate-400 mt-1">
                    {attempt.completedAt
                      ? `Completed ${new Date(attempt.completedAt).toLocaleDateString()}`
                      : `Started ${new Date(attempt.startedAt).toLocaleDateString()}`}
                  </p>
                  <p className="text-slate-500 mt-1">{attempt.status}</p>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-bold text-emerald-600 text-sm">
                    {attempt.percentage ?? 0}%
                  </span>
                  <p className="text-slate-400 mt-1">
                    ({attempt.score ?? 0}/{attempt.questionCount})
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal
        isOpen={isGenModalOpen}
        onClose={() => !isGenerating && setIsGenModalOpen(false)}
        title="Generate AI Quiz"
        subtitle="Choose your subject, topic, difficulty and question count."
      >
        <form onSubmit={handleGenerateQuiz} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Subject
            </label>
            <select
              required
              value={genForm.subject}
              onChange={e =>
                setGenForm({ ...genForm, subject: e.target.value })
              }
              className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
            >
              <option value="Database Management Systems">Database Management Systems</option>
              <option value="Operating Systems">Operating Systems</option>
              <option value="Algorithms">Design & Analysis of Algorithms</option>
              <option value="Computer Networks">Computer Networks</option>
              <option value="Compiler Design">Compiler Design</option>
              <option value="Distributed Systems">Distributed Systems</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Topic / Syllabus Unit
            </label>
            <input
              required
              maxLength={100}
              value={genForm.topic}
              onChange={e =>
                setGenForm({ ...genForm, topic: e.target.value })
              }
              placeholder="e.g. Virtual Memory & LRU Page Replacement"
              className="w-full px-3 py-2 text-xs border rounded-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Difficulty
              </label>
              <select
                value={genForm.difficulty}
                onChange={e =>
                  setGenForm({ ...genForm, difficulty: e.target.value })
                }
                className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Question Count
              </label>
              <select
                value={genForm.questionCount}
                onChange={e =>
                  setGenForm({
                    ...genForm,
                    questionCount: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 text-xs border rounded-lg bg-white"
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              disabled={isGenerating}
              onClick={() => setIsGenModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isGenerating}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isGenerating ? 'Generating...' : 'Generate Quiz'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};