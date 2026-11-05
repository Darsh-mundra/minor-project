import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import {
  Trophy,
  Medal,
  Target,
  CheckCircle,
  BookOpen,
  RefreshCw,
} from 'lucide-react';

type Timeframe = 'weekly' | 'monthly' | 'semester';

interface LeaderboardStudent {
  rank: number;
  userId: number | string;
  displayName: string;
  totalCompletedQuizzes: number;
  totalEarnedPoints: number;
  totalPossiblePoints: number;
  accuracyPercentage: number;
  totalCorrectAnswers: number;
}

const getDateRange = (timeframe: Timeframe) => {
  const now = new Date();
  const start = new Date(now);

  if (timeframe === 'weekly') {
    start.setDate(start.getDate() - 7);
  } else if (timeframe === 'monthly') {
    start.setDate(start.getDate() - 30);
  } else {
    // Calendar semester: January–June or July–December.
    const semesterStartMonth = now.getMonth() < 6 ? 0 : 6;
    start.setFullYear(now.getFullYear(), semesterStartMonth, 1);
    start.setHours(0, 0, 0, 0);
  }

  const toLocalDateTime = (date: Date) => {
    const pad = (value: number) => String(value).padStart(2, '0');

    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
      `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
    );
  };

  return {
    startDate: toLocalDateTime(start),
    endDate: toLocalDateTime(now),
  };
};

const formatPoints = (points: number) =>
  Number(points ?? 0).toLocaleString(undefined, {
    maximumFractionDigits: 2,
  });

const getInitials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? '')
    .join('') || 'S';

export const Leaderboard: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [leaderboardData, setLeaderboardData] = useState<LeaderboardStudent[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>('semester');
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadLeaderboard = async () => {
      setIsLoading(true);
      setLoadError(false);

      try {
        const range = getDateRange(timeframe);

        const data = await api.getSpringLeaderboard({
          ...range,
          page: 0,
          size: 100,
        });

        if (cancelled) return;

        const entries = Array.isArray(data?.content) ? data.content : [];

        setLeaderboardData(
          entries.map((entry: any) => ({
            rank: Number(entry.rank ?? 0),
            userId: entry.userId,
            displayName: entry.displayName || 'Student',
            totalCompletedQuizzes: Number(entry.totalCompletedQuizzes ?? 0),
            totalEarnedPoints: Number(entry.totalEarnedPoints ?? 0),
            totalPossiblePoints: Number(entry.totalPossiblePoints ?? 0),
            accuracyPercentage: Number(entry.accuracyPercentage ?? 0),
            totalCorrectAnswers: Number(entry.totalCorrectAnswers ?? 0),
          }))
        );
      } catch (error: any) {
        if (cancelled) return;

        setLeaderboardData([]);
        setLoadError(true);

        addToast({
          type: 'error',
          title: 'Error loading leaderboard',
          message: error?.message || 'Unable to load leaderboard. Please try again.',
        });
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [timeframe]);

  const isCurrentUser = (student: LeaderboardStudent) =>
    user?.id != null && String(student.userId) === String(user.id);

  const topThree = leaderboardData.slice(0, 3);

  const renderPodiumStudent = (
    student: LeaderboardStudent,
    position: 1 | 2 | 3
  ) => {
    const champion = position === 1;

    return (
      <div
        key={student.userId}
        className={`rounded-2xl text-center space-y-3 ${
          champion
            ? 'bg-gradient-to-b from-indigo-50 to-white border-2 border-indigo-400 p-6 sm:-mt-2'
            : 'bg-white border border-slate-200 p-5'
        } ${position === 2 ? 'sm:mt-5' : ''} ${
          position === 3 ? 'sm:mt-8' : ''
        }`}
      >
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto font-bold ${
            champion
              ? 'bg-amber-400 text-amber-950'
              : position === 2
                ? 'bg-slate-200 text-slate-700'
                : 'bg-amber-100 text-amber-800'
          }`}
        >
          {champion ? (
            <Trophy className="w-7 h-7" />
          ) : (
            <Medal className="w-7 h-7" />
          )}
        </div>

        <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500">
          Rank #{student.rank || position}
        </p>

        <div
          className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center text-sm font-bold ${
            champion
              ? 'bg-indigo-100 text-indigo-700'
              : 'bg-slate-100 text-slate-700'
          }`}
        >
          {getInitials(student.displayName)}
        </div>

        <h3 className="text-sm font-bold text-slate-900 break-words">
          {student.displayName}
          {isCurrentUser(student) && (
            <span className="block text-[10px] text-indigo-600 mt-1">
              You
            </span>
          )}
        </h3>

        <p className="text-xl font-extrabold text-indigo-600 tabular-nums">
          {formatPoints(student.totalEarnedPoints)}
          <span className="text-xs font-medium text-slate-400 ml-1">
            pts
          </span>
        </p>

        <p className="text-xs text-slate-500">
          {student.accuracyPercentage.toFixed(1)}% accuracy
        </p>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Student Leaderboard
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Compare quiz performance, accuracy and earned points with other students.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg self-start">
          {(['weekly', 'monthly', 'semester'] as const).map(item => (
            <button
              key={item}
              onClick={() => setTimeframe(item)}
              aria-pressed={timeframe === item}
              className={`px-3 py-2 rounded-md text-xs font-semibold capitalize transition-colors ${
                timeframe === item
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      {/* Performance summary */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm">
        <h2 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-2">
          How rankings work
        </h2>
        <p className="text-sm text-slate-300 leading-relaxed">
          Rankings use quiz-performance data from the backend. Earned points,
          completed quizzes, correct answers and accuracy help you track your
          academic progress.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5">
          <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
            <Trophy className="w-5 h-5 text-amber-400 mb-2" />
            <p className="text-xs text-slate-400">Earned Points</p>
            <p className="text-sm font-bold mt-1">Quiz performance</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
            <BookOpen className="w-5 h-5 text-indigo-400 mb-2" />
            <p className="text-xs text-slate-400">Completed Quizzes</p>
            <p className="text-sm font-bold mt-1">Practice progress</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800 border border-slate-700">
            <Target className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-xs text-slate-400">Accuracy</p>
            <p className="text-sm font-bold mt-1">Correct answers</p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
          <RefreshCw className="w-7 h-7 animate-spin text-indigo-600 mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading leaderboard...</p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && loadError && (
        <div className="bg-white border border-red-200 rounded-2xl p-8 text-center">
          <p className="text-sm font-semibold text-slate-800">
            Could not load leaderboard
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Check your connection and try changing the timeframe.
          </p>
          <button
            onClick={() => setTimeframe(current => current)}
            className="mt-4 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
          >
            Try again
          </button>
        </div>
      )}

      {/* Top three */}
      {!isLoading && !loadError && topThree.length > 0 && (
        <section>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 mb-5">
            Top Performers
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {topThree
              .slice()
              .sort((a, b) => {
                const order = (rank: number) => rank === 1 ? 0 : rank === 2 ? 1 : 2;
                return order(a.rank) - order(b.rank);
              })
              .map(student =>
                renderPodiumStudent(
                  student,
                  (student.rank as 1 | 2 | 3) || 3
                )
              )}
          </div>
        </section>
      )}

      {/* Rankings */}
      {!isLoading && !loadError && (
        <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Student Rankings
            </h2>
            <span className="text-xs text-slate-400">
              {leaderboardData.length} students shown
            </span>
          </div>

          {leaderboardData.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">
                No leaderboard data yet
              </h3>
              <p className="text-xs text-slate-500 mt-2">
                Complete a quiz to start building your performance record.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leaderboardData.map(student => {
                const currentUser = isCurrentUser(student);

                return (
                  <div
                    key={student.userId}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors ${
                      currentUser
                        ? 'bg-indigo-50/70'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 shrink-0 text-center text-sm font-bold text-slate-400 tabular-nums">
                        #{student.rank}
                      </span>

                      <div
                        className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
                          currentUser
                            ? 'bg-indigo-600 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {getInitials(student.displayName)}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-slate-900 break-words">
                          {student.displayName}
                          {currentUser && (
                            <span className="text-indigo-600 ml-1">(You)</span>
                          )}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">
                          {student.totalCompletedQuizzes} quizzes ·{' '}
                          {student.totalCorrectAnswers} correct answers
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 pl-11 sm:pl-0">
                      <div className="text-right">
                        <p className="text-sm font-bold text-indigo-600 tabular-nums">
                          {student.accuracyPercentage.toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Accuracy
                        </p>
                      </div>

                      <div className="text-right min-w-20">
                        <p className="text-sm font-extrabold text-slate-800 tabular-nums">
                          {formatPoints(student.totalEarnedPoints)} pts
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Earned points
                        </p>
                      </div>

                      <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
