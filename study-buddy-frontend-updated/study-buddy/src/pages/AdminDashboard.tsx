import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { StatCard } from '../components/common/StatCard';
import {
  ShieldAlert,
  Users2,
  BookOpen,
  BrainCircuit,
  FolderGit2,
  Briefcase,
  AlertTriangle,
  Trash2,
  UserX,
  UserCheck,
  Activity,
  ExternalLink,
  MessagesSquare,
  Plus,
} from 'lucide-react';

interface AdminDashboardProps {
  onOpenWorkspace?: (workspaceId: string) => void;
  onOpenProjects?: () => void;
  onOpenOpportunities?: () => void;
}

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '-');

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenWorkspace, onOpenProjects, onOpenOpportunities }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadAdminStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Admin Error', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAdminStats();
  }, []);

  const handleToggleDisableUser = async (userId: string) => {
    try {
      const res = await api.toggleUserDisabled(userId);
      addToast({ type: 'info', title: res.message });
      loadAdminStats();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Action failed', message: err.message });
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!confirm('Are you sure you want to permanently delete this resource?')) return;
    try {
      await api.deleteAdminResource(resourceId);
      addToast({ type: 'success', title: 'Resource Deleted' });
      loadAdminStats();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete error', message: err.message });
    }
  };

  const handleDeleteDiscussion = async (discussionId: string) => {
    if (!confirm('Are you sure you want to permanently delete this discussion?')) return;
    try {
      await api.deleteAdminDiscussion(discussionId);
      addToast({ type: 'success', title: 'Discussion Deleted' });
      loadAdminStats();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Delete error', message: err.message });
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading university governance console...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Top Header */}
      <div>
        <div className="inline-flex items-center gap-1.5 text-indigo-600 text-xs font-bold mb-1">
          <ShieldAlert className="w-4 h-4" />
          <span>University Academic Administration Console</span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
          Platform Governance & Moderation
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Monitor active enrollment, verify academic resource integrity, and review reported content.
        </p>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Registered Students"
          value={stats.totalStudents}
          subtext={`${stats.totalAdmins} admin${stats.totalAdmins === 1 ? '' : 's'} · ${stats.disabledCount} disabled`}
          icon={<Users2 className="w-5 h-5 text-indigo-500" />}
        />
        <StatCard
          label="Academic Resources"
          value={stats.totalResources}
          icon={<BookOpen className="w-5 h-5 text-emerald-500" />}
        />
        <StatCard
          label="Study Workspaces"
          value={stats.totalWorkspaces}
          icon={<Users2 className="w-5 h-5 text-sky-500" />}
        />
        <StatCard
          label="Reported Items"
          value={stats.reportedCount}
          subtext="Flagged for moderation"
          icon={<AlertTriangle className="w-5 h-5 text-rose-500" />}
        />
        <StatCard
          label="Projects"
          value={stats.totalProjects}
          icon={<FolderGit2 className="w-5 h-5 text-violet-500" />}
        />
        <StatCard
          label="Discussions"
          value={stats.totalDiscussions}
          icon={<MessagesSquare className="w-5 h-5 text-amber-500" />}
        />
        <StatCard
          label="Quizzes"
          value={stats.totalQuizzes}
          icon={<BrainCircuit className="w-5 h-5 text-pink-500" />}
        />
        <StatCard
          label="Opportunities"
          value={stats.totalOpportunities}
          icon={<Briefcase className="w-5 h-5 text-teal-500" />}
        />
      </div>

      {/* Quick action + recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-3">
            <Activity className="w-4 h-4 text-indigo-500" />
            Recent Platform Activity
          </h2>
          {stats.recentActivity?.length ? (
            <ul className="divide-y divide-slate-100">
              {stats.recentActivity.map((a: any, i: number) => (
                <li key={i} className="py-2 flex items-center justify-between gap-3 text-xs">
                  <span className="text-slate-700 min-w-0 truncate">
                    <span className="font-bold text-slate-900">{a.type}:</span> {a.text}
                  </span>
                  <span className="text-slate-400 shrink-0">{fmtDate(a.at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 py-4 text-center">No activity yet.</p>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 mb-1">
            <Briefcase className="w-4 h-4 text-teal-500" />
            Opportunities
          </h2>
          <p className="text-xs text-slate-500 mb-4">
            Only admins can post internships, hackathons and other opportunities for students.
          </p>
          <button
            onClick={onOpenOpportunities}
            disabled={!onOpenOpportunities}
            className="w-full px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Post an Opportunity
          </button>
        </section>
      </div>

      {/* Reported Items Review Section */}
      <section className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            Reported Content for Review ({stats.reportedResources?.length + stats.reportedDiscussions?.length})
          </h2>
        </div>

        {stats.reportedResources?.length === 0 && stats.reportedDiscussions?.length === 0 ? (
          <p className="text-xs text-slate-500 py-4 text-center">
            No active flags. Platform resources and discussions are clean.
          </p>
        ) : (
          <div className="space-y-3">
            {stats.reportedResources?.map((res: any) => (
              <div
                key={res.id}
                className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between text-xs gap-4"
              >
                <div>
                  <span className="font-bold text-rose-700 uppercase tracking-wider text-[10px]">
                    Reported Resource ({res.reportsCount} flags)
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">{res.title}</h4>
                  <p className="text-slate-500 text-[11px]">
                    {res.subject} · Uploaded by {res.uploaderName}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteResource(res.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs inline-flex items-center gap-1 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove Resource
                </button>
              </div>
            ))}

            {stats.reportedDiscussions?.map((disc: any) => (
              <div
                key={disc.id}
                className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex items-center justify-between text-xs gap-4"
              >
                <div>
                  <span className="font-bold text-rose-700 uppercase tracking-wider text-[10px]">
                    Reported Discussion Thread
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm mt-0.5">{disc.title}</h4>
                  <p className="text-slate-500 text-[11px]">
                    {disc.subject} · Started by {disc.authorName}
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteDiscussion(disc.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs inline-flex items-center gap-1 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Thread
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* User Management Section */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Registered Student Accounts & Access Controls
          </h2>
          <span className="text-xs text-slate-400">Total: {stats.users?.length} accounts</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5">Student Name</th>
                <th className="p-3.5">Email</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Points</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.users?.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900">{u.fullName}</td>
                  <td className="p-3.5 text-slate-500">{u.email}</td>
                  <td className="p-3.5">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        u.role === 'ADMIN'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="p-3.5 font-bold tabular-nums text-slate-800">{u.points}</td>
                  <td className="p-3.5">
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                        u.disabled
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {u.disabled ? 'Disabled' : 'Active'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => handleToggleDisableUser(u.id)}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                          u.disabled
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        {u.disabled ? 'Enable Account' : 'Disable Account'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* All Resources (delete any) */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">All Academic Resources</h2>
          <span className="text-xs text-slate-400">Showing latest {stats.allResources?.length} of {stats.totalResources}</span>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0">
              <tr>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Subject</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Uploaded by</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.allResources?.map((r: any) => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="p-3.5 font-bold text-slate-900">
                    {r.title}
                    {r.isReported && <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">Reported</span>}
                  </td>
                  <td className="p-3.5 text-slate-500">{r.subject}</td>
                  <td className="p-3.5 text-slate-500">{r.resourceType}</td>
                  <td className="p-3.5 text-slate-500">{r.uploaderName}</td>
                  <td className="p-3.5 text-slate-500">{fmtDate(r.uploadDate)}</td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDeleteResource(r.id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* All Discussions (delete any) */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">All Discussion Posts</h2>
          <span className="text-xs text-slate-400">Total: {stats.allDiscussions?.length}</span>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0">
              <tr>
                <th className="p-3.5">Title</th>
                <th className="p-3.5">Subject</th>
                <th className="p-3.5">Started by</th>
                <th className="p-3.5">Answers</th>
                <th className="p-3.5">Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.allDiscussions?.map((d: any) => (
                <tr key={d.id} className="hover:bg-slate-50/60">
                  <td className="p-3.5 font-bold text-slate-900">
                    {d.title}
                    {d.isReported && <span className="ml-2 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800">Reported</span>}
                  </td>
                  <td className="p-3.5 text-slate-500">{d.subject}</td>
                  <td className="p-3.5 text-slate-500">{d.authorName}</td>
                  <td className="p-3.5 text-slate-500 tabular-nums">{d.answers}</td>
                  <td className="p-3.5 text-slate-500">{fmtDate(d.createdAt)}</td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleDeleteDiscussion(d.id)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Every workspace, member or not */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">All Study Workspaces</h2>
          <span className="text-xs text-slate-400">Total: {stats.allWorkspaces?.length}</span>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0">
              <tr>
                <th className="p-3.5">Workspace</th>
                <th className="p-3.5">Subject</th>
                <th className="p-3.5">Created by</th>
                <th className="p-3.5">Members</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.allWorkspaces?.map((w: any) => (
                <tr key={w.id} className="hover:bg-slate-50/60">
                  <td className="p-3.5 font-bold text-slate-900">{w.name}</td>
                  <td className="p-3.5 text-slate-500">{w.subject}</td>
                  <td className="p-3.5 text-slate-500">{w.creatorName}</td>
                  <td className="p-3.5 text-slate-500 tabular-nums">{w.members}/{w.maxMembers}</td>
                  <td className="p-3.5">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${w.isArchived ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-800'}`}>
                      {w.isArchived ? 'Archived' : 'Active'}
                    </span>
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => onOpenWorkspace?.(w.id)}
                      disabled={!onOpenWorkspace}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 inline-flex items-center gap-1 disabled:opacity-50"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Every project, member or not */}
      <section className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">All Collaboration Projects</h2>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400">Total: {stats.allProjects?.length}</span>
            <button
              onClick={onOpenProjects}
              disabled={!onOpenProjects}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 inline-flex items-center gap-1 disabled:opacity-50"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Open Project Hub
            </button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider sticky top-0">
              <tr>
                <th className="p-3.5">Project</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Created by</th>
                <th className="p-3.5">Members</th>
                <th className="p-3.5">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.allProjects?.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50/60">
                  <td className="p-3.5 font-bold text-slate-900">{p.projectName}</td>
                  <td className="p-3.5 text-slate-500">{p.projectType}</td>
                  <td className="p-3.5 text-slate-500">{String(p.status).replace('_', ' ')}</td>
                  <td className="p-3.5 text-slate-500">{p.creatorName}</td>
                  <td className="p-3.5 text-slate-500 tabular-nums">{p.members}</td>
                  <td className="p-3.5 text-slate-500">{fmtDate(p.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
