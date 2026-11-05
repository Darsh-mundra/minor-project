
import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import {
  BookOpen,
  Users2,
  BrainCircuit,
  Trophy,
  ArrowRight,
  Sparkles,
  Calendar,
  CheckCircle,
  Award,
} from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
  setSelectedWorkspaceId: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  setActiveTab,
  setSelectedWorkspaceId,
}) => {
  const { user } = useAuth();

  const [recentResources, setRecentResources] = useState<any[]>([]);
  const [activeWorkspaces, setActiveWorkspaces] = useState<any[]>([]);
  const [recentAttempts, setRecentAttempts] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        setIsLoading(true);

        const dashboardData = await api.getStudentDashboard();

        if (!isMounted) return;

        setRecentResources(dashboardData.recentResources ?? []);
        setActiveWorkspaces(
          dashboardData.workspaceData?.userWorkspaces ?? []
        );
        setRecentAttempts(dashboardData.recentAttempts ?? []);
        setOpportunities(dashboardData.opportunities ?? []);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, []);

  const averageQuizScore =
    recentAttempts.length > 0
      ? Math.round(
          recentAttempts.reduce(
            (total, attempt) =>
              total + (Number(attempt.percentage) || 0),
            0
          ) / recentAttempts.length
        )
      : 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 border border-slate-800 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-4 border border-indigo-500/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              Welcome back, {user?.fullName?.split(' ')[0] || 'Scholar'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Academic Command Center
          </h1>

          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Collaborate on course notes, practice with AI-generated test
            sets, and prepare for upcoming exams with your study groups.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={() => setActiveTab('resources')}
              className="px-4 py-2 text-xs font-semibold text-slate-900 bg-white rounded-lg hover:bg-slate-100 transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Upload &amp; Explore Notes
            </button>

            <button
              onClick={() => setActiveTab('workspaces')}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors shadow-sm inline-flex items-center gap-2"
            >
              <Users2 className="w-4 h-4" />
              Join Study Workspace
            </button>

            <button
              onClick={() => setActiveTab('ai-assistant')}
              className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-lg transition-colors border border-slate-700 inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              Ask AI Assistant
            </button>
          </div>
        </div>

        {/* Decorative campus image */}
        <div className="hidden lg:block absolute right-0 top-0 bottom-0 w-1/3 opacity-25 mix-blend-luminosity pointer-events-none">
          <img
            src="/src/assets/images/campus_collaboration_1791044487396.jpg"
            alt="Campus Collaboration"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Recent Resources"
          value={recentResources.length}
          subtext="Latest academic resources"
          icon={<BookOpen className="w-5 h-5 text-amber-500" />}
        />

        <StatCard
          label="Active Workspaces"
          value={activeWorkspaces.length}
          subtext="Your study groups"
          icon={<Users2 className="w-5 h-5 text-indigo-500" />}
        />

        <StatCard
          label="Avg Quiz Accuracy"
          value={`${averageQuizScore}%`}
          subtext={`${recentAttempts.length} recent quiz attempts`}
          icon={<BrainCircuit className="w-5 h-5 text-emerald-500" />}
        />

        <StatCard
          label="Opportunities"
          value={opportunities.length}
          subtext="Available opportunities"
          icon={<Trophy className="w-5 h-5 text-sky-500" />}
        />
      </div>

      {/* Main Grid: Workspaces & Deadlines */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Workspaces & Resources */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Workspaces */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Active Study Workspaces
                </h2>
                <p className="text-xs text-slate-500">
                  Collaborative groups with shared notes and tasks
                </p>
              </div>

              <button
                onClick={() => setActiveTab('workspaces')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                View all ({activeWorkspaces.length})
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading ? (
              <p className="p-8 text-center text-xs text-slate-500">
                Loading workspaces...
              </p>
            ) : activeWorkspaces.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Users2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  No active workspaces joined
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Create a sprint workspace or enter a join code.
                </p>
                <button
                  onClick={() => setActiveTab('workspaces')}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                >
                  Join Workspace
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeWorkspaces.map((ws) => (
                  <div
                    key={ws.id}
                    onClick={() => {
                      setSelectedWorkspaceId(String(ws.id));
                      setActiveTab('workspace-detail');
                    }}
                    className="group cursor-pointer p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:shadow-sm transition-all bg-white"
                  >
                    <div className="flex items-start justify-between">
                      <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">
                        {ws.subject || 'Study Group'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {ws.joinCode ? `Code: ${ws.joinCode}` : ''}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-1.5 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {ws.name || 'Untitled Workspace'}
                    </h3>

                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {ws.description || 'Collaborate with your study group.'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Users2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="tabular-nums">
                          {ws.memberIds?.length ?? 1} members
                        </span>
                      </div>

                      {ws.examDate && (
                        <div className="flex items-center gap-1 text-amber-700 text-[11px] font-medium">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Exam: {ws.examDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Resources */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Recent Academic Resources
                </h2>
                <p className="text-xs text-slate-500">
                  Verified notes, question papers, and manuals
                </p>
              </div>

              <button
                onClick={() => setActiveTab('resources')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
              >
                Browse Hub
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {isLoading ? (
              <p className="py-6 text-center text-xs text-slate-500">
                Loading resources...
              </p>
            ) : recentResources.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <BookOpen className="w-7 h-7 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">
                  No resources available
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Resources will appear here when available.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentResources.map((res) => (
                  <div
                    key={res.id}
                    onClick={() => setActiveTab('resources')}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/80 px-2 rounded-lg cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">
                          {res.subject}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{res.resourceType}</span>
                        {res.chapterUnit && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{res.chapterUnit}</span>
                          </>
                        )}
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-0.5">
                        {res.title}
                      </h3>

                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {res.downloadCount ?? 0} downloads · ★{' '}
                        {Number(res.averageRating ?? 0).toFixed(1)}
                        {res.ratingCount != null &&
                          ` (${res.ratingCount} ratings)`}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                      View
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deadlines, Badges & Opportunities */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 tracking-tight mb-3">
              Upcoming Deadlines
            </h2>

            <div className="p-6 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
              <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-700">
                No deadlines available
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Upcoming deadlines will appear here when deadline data is available.
              </p>
            </div>
          </div>

          {/* Student Badges */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Earned Badges
              </h2>
              <button
                onClick={() => setActiveTab('leaderboard')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Leaderboard
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="w-full p-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <Award className="w-6 h-6 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-500">
                  Badge data is not available yet.
                </p>
              </div>
            </div>
          </div>

          {/* Recommended Opportunities */}
          <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Recommended For You
              </h2>
              <button
                onClick={() => setActiveTab('opportunities')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                Explore
              </button>
            </div>

            {isLoading ? (
              <p className="py-4 text-center text-xs text-slate-500">
                Loading opportunities...
              </p>
            ) : opportunities.length === 0 ? (
              <div className="p-4 text-center bg-slate-50 rounded-lg border border-dashed border-slate-200">
                <p className="text-xs text-slate-500">
                  No opportunities available.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {opportunities.map((opp) => (
                  <div
                    key={opp.id}
                    onClick={() => setActiveTab('opportunities')}
                    className="p-3 rounded-lg border border-slate-100 hover:border-slate-300 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 gap-2">
                      <span className="font-semibold text-indigo-600">
                        {opp.category}
                      </span>
                      <span>
                        {opp.deadline ? `Due ${opp.deadline}` : ''}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                      {opp.title}
                    </p>

                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {opp.providerName || opp.organizer || 'Organization not specified'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
