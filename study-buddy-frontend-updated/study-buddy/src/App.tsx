import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { AuthPage } from './pages/AuthPage';
import { Dashboard } from './pages/Dashboard';
import { ResourceHub } from './pages/ResourceHub';
import { UnitDetail } from './pages/UnitDetail';
import { ResourceRequests } from './pages/ResourceRequests';
import { Workspaces } from './pages/Workspaces';
import { WorkspaceDetail } from './pages/WorkspaceDetail';
import { QuizHub } from './pages/QuizHub';
import { FlashcardHub } from './pages/FlashcardHub';
import { AiAssistant } from './pages/AiAssistant';
import { DiscussionForum } from './pages/DiscussionForum';
import { ProjectHub } from './pages/ProjectHub';
import { SkillProfile } from './pages/SkillProfile';
import { OpportunitiesHub } from './pages/OpportunitiesHub';
import { Leaderboard } from './pages/Leaderboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { Menu, X } from 'lucide-react';
import { BrowserRouter, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const MainAppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>('ws-1');
  const [selectedQuizId, setSelectedQuizId] = useState<string | undefined>(undefined);
  const [unitTarget, setUnitTarget] = useState<{ subject: string; semester: string; branch: string; unit: string; upload?: boolean } | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const match = location.pathname.match(/^\/workspaces\/([^/]+)$/);

    if (match) {
      setSelectedWorkspaceId(decodeURIComponent(match[1]));
    }
  }, [location.pathname]);

  const routeMap: Record<string, string> = {
    '/dashboard': 'dashboard',
    '/resources': 'resources',
    '/resource-requests': 'resource-requests',
    '/workspaces': 'workspaces',
    '/quizzes': 'quizzes',
    '/flashcards': 'flashcards',
    '/ai-assistant': 'ai-assistant',
    '/discussions': 'discussions',
    '/projects': 'projects',
    '/skills': 'skills',
    '/opportunities': 'opportunities',
    '/leaderboard': 'leaderboard',
    '/admin': 'admin',
  };

  const activeTab =
    routeMap[location.pathname] ??
    (location.pathname.startsWith('/workspaces/') ? 'workspace-detail' :
      location.pathname === '/resources/unit' ? 'unit-detail' :
        'dashboard');

  const setActiveTab = (tab: string) => {
    const paths: Record<string, string> = {
      dashboard: '/dashboard',
      resources: '/resources',
      'resource-requests': '/resource-requests',
      workspaces: '/workspaces',
      'workspace-detail': `/workspaces/${selectedWorkspaceId ?? 'ws-1'}`,
      quizzes: '/quizzes',
      flashcards: '/flashcards',
      'ai-assistant': '/ai-assistant',
      discussions: '/discussions',
      projects: '/projects',
      skills: '/skills',
      opportunities: '/opportunities',
      leaderboard: '/leaderboard',
      admin: '/admin',
      'unit-detail': '/resources/unit',
    };

    navigate(paths[tab] ?? '/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">Connecting to Study Buddy...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard
            setActiveTab={setActiveTab}
            setSelectedWorkspaceId={(id) => {
              setSelectedWorkspaceId(id);
              setActiveTab('workspace-detail');
            }}
          />
        );
      case 'resources':
        return (
          <ResourceHub
            key={unitTarget ? `${unitTarget.branch}-${unitTarget.subject}-${unitTarget.semester}-${unitTarget.upload}` : 'hub'}
            initialSubject={unitTarget?.subject}
            initialSemester={unitTarget?.semester}
            initialBranch={unitTarget?.branch}
            initialUnit={unitTarget?.unit}
            openUpload={!!unitTarget?.upload}
            onOpenUnit={(subject, semester, unit, branch) => {
              setUnitTarget({ subject, semester, unit, branch });
              setActiveTab('unit-detail');
            }}
          />
        );
      case 'unit-detail':
        return unitTarget ? (
          <UnitDetail
            subject={unitTarget.subject}
            semester={unitTarget.semester}
            branch={unitTarget.branch}
            unit={unitTarget.unit}
            onBack={() => setActiveTab('resources')}
            onChangeUnit={u => setUnitTarget({ ...unitTarget, unit: u })}
            onUpload={() => { setUnitTarget({ ...unitTarget, upload: true }); setActiveTab('resources'); }}
          />
        ) : null;
      case 'resource-requests':
        return <ResourceRequests />;
      case 'workspaces':
        return (
          <Workspaces
            onSelectWorkspace={(id) => {
              setSelectedWorkspaceId(id);
              navigate(`/workspaces/${encodeURIComponent(id)}`);
            }}
          />
        );
      case 'workspace-detail':
        return selectedWorkspaceId ? (
          <WorkspaceDetail
            workspaceId={selectedWorkspaceId}
            onBack={() => setActiveTab('workspaces')}
            onNavigateToQuiz={(quizId) => {
              setSelectedQuizId(quizId);
              setActiveTab('quizzes');
            }}
            onNavigateToFlashcards={() => setActiveTab('flashcards')}
          />
        ) : null; case 'quizzes':
        return <QuizHub initialQuizId={selectedQuizId} />;
      case 'flashcards':
        return <FlashcardHub />;
      case 'ai-assistant':
        return <AiAssistant />;
      case 'discussions':
        return <DiscussionForum />;
      case 'projects':
        return <ProjectHub />;
      case 'skills':
        return <SkillProfile />;
      case 'opportunities':
        return <OpportunitiesHub />;
      case 'leaderboard':
        return <Leaderboard />;
      case 'admin':
        return user.role === 'ADMIN' ? (
          <AdminDashboard
            onOpenWorkspace={(id) => { setSelectedWorkspaceId(id); setActiveTab('workspace-detail'); }}
            onOpenProjects={() => setActiveTab('projects')}
            onOpenOpportunities={() => setActiveTab('opportunities')}
          />
        ) : <Dashboard setActiveTab={setActiveTab} setSelectedWorkspaceId={setSelectedWorkspaceId} />;
      default:
        return <Dashboard setActiveTab={setActiveTab} setSelectedWorkspaceId={setSelectedWorkspaceId} />;
    }

  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Mobile Drawer Toggle floating button */}
      <div className="lg:hidden fixed bottom-5 left-5 z-40">
        <button
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Body with Sidebar + Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={isMobileSidebarOpen}
          setIsOpen={setIsMobileSidebarOpen}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">
          {renderActivePage()}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <MainAppContent />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
