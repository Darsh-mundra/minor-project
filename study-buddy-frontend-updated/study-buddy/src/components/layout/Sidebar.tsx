import React from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  HelpCircle,
  Users2,
  BrainCircuit,
  Layers,
  Sparkles,
  MessageSquare,
  FolderGit2,
  UserCheck,
  Briefcase,
  Trophy,
  ShieldAlert,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpen,
  setIsOpen,
}) => {
  const { user } = useAuth();

  const navigationGroups = [
    {
      group: 'Overview',
      items: [
        { id: 'dashboard', label: 'Student Dashboard', icon: LayoutDashboard },
      ],
    },
    {
      group: 'Academics',
      items: [
        { id: 'resources', label: 'Resource Hub', icon: BookOpen },
        { id: 'resource-requests', label: 'Resource Requests', icon: HelpCircle },
      ],
    },
    {
      group: 'Collaboration',
      items: [
        { id: 'workspaces', label: 'Study Workspaces', icon: Users2 },
//        { id: 'discussions', label: 'Doubt Discussion', icon: MessageSquare },
//        { id: 'projects', label: 'Project Teams', icon: FolderGit2 },
      ],
    },
    {
      group: 'AI Learning Tools',
      items: [
        { id: 'quizzes', label: 'AI Quiz Generator', icon: BrainCircuit },
        { id: 'flashcards', label: 'AI Flashcards', icon: Layers },
        { id: 'ai-assistant', label: 'AI Study Assistant', icon: Sparkles },
      ],
    },
    {
      group: 'Student Growth',
      items: [
        { id: 'skills', label: 'Skill Profile', icon: UserCheck },
        { id: 'opportunities', label: 'Opportunities Hub', icon: Briefcase },
        { id: 'leaderboard', label: 'Leaderboard & Badges', icon: Trophy },
      ],
    },
  ];

  if (user?.role === 'ADMIN') {
    navigationGroups.push({
      group: 'Administration',
      items: [
        { id: 'admin', label: 'Admin Dashboard', icon: ShieldAlert },
      ],
    });
  }

  return (
    <aside
      className={`fixed lg:sticky top-16 left-0 z-30 w-64 h-[calc(100vh-4rem)] bg-white border-r border-slate-200 overflow-y-auto transition-transform lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
    >
      <div className="p-4 space-y-6">
        {navigationGroups.map((section) => (
          <div key={section.group}>
            <p className="px-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              {section.group}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive =
                  activeTab === item.id ||
                  (item.id === 'workspaces' && activeTab === 'workspace-detail') ||
                  (item.id === 'resources' && activeTab === 'unit-detail');
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg transition-colors text-left ${isActive
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                  >
                    <Icon
                      className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'
                        }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};
