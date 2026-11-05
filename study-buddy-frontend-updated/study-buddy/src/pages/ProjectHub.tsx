import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Project } from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import {
  FolderGit2,
  Plus,
  Users2,
  ExternalLink,
  CheckCircle,
  Clock,
  CheckSquare,
  Sparkles,
  GitBranch,
} from 'lucide-react';

export const ProjectHub: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [joinMessage, setJoinMessage] = useState('');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  // New task state for active project
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Form State
  const [createForm, setCreateForm] = useState({
    projectName: '',
    description: '',
    projectType: 'Academic',
    requiredSkills: 'React, TypeScript, Node.js',
    githubUrl: '',
  });

  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const data = await api.getProjects();
      setProjects(data);
      if (data.length > 0 && !selectedProjectId) {
        setSelectedProjectId(data[0].id);
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error loading projects', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.projectName || !createForm.description) {
      addToast({ type: 'error', title: 'Missing fields', message: 'Project name and description are required.' });
      return;
    }

    try {
      const skillsArray = createForm.requiredSkills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const created = await api.createProject({
        ...createForm,
        requiredSkills: skillsArray,
      });

      addToast({
        type: 'success',
        title: 'Project Created!',
        message: `"${created.projectName}" is now recruiting teammates (+30 points).`,
      });
      setIsCreateModalOpen(false);
      setProjects(prev => [created, ...prev]);
      setSelectedProjectId(created.id);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleRequestJoin = async (projectId: string) => {
    try {
      await api.requestJoinProject(projectId, joinMessage);
      addToast({
        type: 'success',
        title: 'Request Sent',
        message: 'Your join request was submitted to the project lead.',
      });
      setIsJoinModalOpen(false);
      setJoinMessage('');
      loadProjects();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Join Request Failed', message: err.message });
    }
  };

  const handleManageRequest = async (projectId: string, targetUserId: string, action: 'ACCEPT' | 'REJECT') => {
    try {
      await api.manageProjectRequest(projectId, { targetUserId, action });
      addToast({
        type: 'success',
        title: `Member ${action === 'ACCEPT' ? 'Accepted' : 'Declined'}`,
      });
      loadProjects();
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleAddTask = async (projectId: string) => {
    if (!newTaskTitle.trim()) return;

    try {
      const task = await api.addProjectTask(projectId, { title: newTaskTitle.trim() });
      setProjects(prev =>
        prev.map(p => (p.id === projectId ? { ...p, tasks: [...p.tasks, task] } : p))
      );
      setNewTaskTitle('');
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error adding task', message: err.message });
    }
  };

  const handleUpdateTaskStatus = async (projectId: string, taskId: string, nextStatus: 'TODO' | 'IN_PROGRESS' | 'DONE') => {
    try {
      await api.updateProjectTask(projectId, taskId, nextStatus);
      setProjects(prev =>
        prev.map(p =>
          p.id === projectId
            ? {
                ...p,
                tasks: p.tasks.map(t => (t.id === taskId ? { ...t, status: nextStatus } : t)),
              }
            : p
        )
      );
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const activeProject = projects.find(p => p.id === selectedProjectId);
  const isMemberOfActive = activeProject?.members.some(m => m.userId === user?.id);
  const isCreatorOfActive = activeProject?.creatorId === user?.id;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Project Collaboration Teams
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Discover peer academic projects, build hackathon teams, and manage development sprint tasks.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Project
        </button>
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Projects List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map(n => (
                <div key={n} className="h-36 bg-white rounded-xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : projects.length === 0 ? (
            <EmptyState
              title="No collaborative projects found"
              description="Be the first to launch an academic project or hackathon initiative."
              actionText="Create Project"
              onAction={() => setIsCreateModalOpen(true)}
            />
          ) : (
            projects.map(proj => {
              const isSelected = proj.id === selectedProjectId;

              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProjectId(proj.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-white ring-1 ring-indigo-600 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-bold text-indigo-700 uppercase tracking-wider">
                      {proj.projectType}
                    </span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold border border-emerald-200">
                      {proj.status}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-1.5">{proj.projectName}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {proj.requiredSkills.slice(0, 3).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Lead: {proj.creatorName}</span>
                    <span>{proj.members.length} members</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Col: Active Project Workspace (7 cols) */}
        <div className="lg:col-span-7">
          {activeProject ? (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              {/* Project Head */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                      {activeProject.projectType} Project
                    </span>
                    <h2 className="text-lg font-extrabold text-slate-900 mt-0.5">
                      {activeProject.projectName}
                    </h2>
                  </div>

                  {!isMemberOfActive && (
                    <button
                      onClick={() => setIsJoinModalOpen(true)}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs inline-flex items-center gap-1.5"
                    >
                      <Users2 className="w-3.5 h-3.5" />
                      Request to Join
                    </button>
                  )}
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">
                  {activeProject.description}
                </p>

                {activeProject.githubUrl && (
                  <div className="pt-1">
                    <a
                      href={activeProject.githubUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-colors"
                    >
                      <GitBranch className="w-4 h-4 text-slate-500" />
                      <span>{activeProject.githubUrl}</span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                )}
              </div>

              {/* Join Requests Review (Visible to Lead) */}
              {isCreatorOfActive && activeProject.joinRequests?.length > 0 && (
                <div className="p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-2">
                  <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    Pending Join Requests ({activeProject.joinRequests.length})
                  </h4>
                  {activeProject.joinRequests.map(req => (
                    <div
                      key={req.userId}
                      className="p-3 bg-white rounded-lg border border-indigo-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{req.fullName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{req.message}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleManageRequest(activeProject.id, req.userId, 'ACCEPT')}
                          className="px-2.5 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleManageRequest(activeProject.id, req.userId, 'REJECT')}
                          className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg"
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Members List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Team Members ({activeProject.members.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {activeProject.members.map(m => (
                    <div
                      key={m.userId}
                      className="p-3 rounded-lg border border-slate-100 bg-slate-50 flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800">{m.fullName}</span>
                      <span className="text-[11px] text-slate-500 font-medium">{m.role}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Kanban Sprint Tasks */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Project Kanban Tasks
                  </h3>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {(['TODO', 'IN_PROGRESS', 'DONE'] as const).map(colStatus => {
                    const colTasks = activeProject.tasks.filter(t => t.status === colStatus);

                    return (
                      <div key={colStatus} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-600 uppercase mb-2">
                          <span>{colStatus.replace('_', ' ')}</span>
                          <span className="tabular-nums">({colTasks.length})</span>
                        </div>

                        <div className="space-y-2 min-h-[100px]">
                          {colTasks.map(task => (
                            <div
                              key={task.id}
                              className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs shadow-2xs space-y-1.5"
                            >
                              <p className="font-semibold text-slate-900 leading-snug">{task.title}</p>
                              {task.assigneeName && (
                                <p className="text-[10px] text-slate-400">{task.assigneeName}</p>
                              )}
                              {isMemberOfActive && (
                                <div className="pt-1 flex items-center justify-between text-[10px] text-indigo-600">
                                  {colStatus !== 'TODO' && (
                                    <button
                                      onClick={() =>
                                        handleUpdateTaskStatus(
                                          activeProject.id,
                                          task.id,
                                          colStatus === 'DONE' ? 'IN_PROGRESS' : 'TODO'
                                        )
                                      }
                                      className="hover:underline"
                                    >
                                      ← Prev
                                    </button>
                                  )}
                                  {colStatus !== 'DONE' && (
                                    <button
                                      onClick={() =>
                                        handleUpdateTaskStatus(
                                          activeProject.id,
                                          task.id,
                                          colStatus === 'TODO' ? 'IN_PROGRESS' : 'DONE'
                                        )
                                      }
                                      className="ml-auto hover:underline font-semibold"
                                    >
                                      Next →
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Task input (members only) */}
                {isMemberOfActive && (
                  <div className="flex gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="Add task to project board..."
                      value={newTaskTitle}
                      onChange={e => setNewTaskTitle(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddTask(activeProject.id)}
                      className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                    <button
                      onClick={() => handleAddTask(activeProject.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
                    >
                      Add Task
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
              Select a project from the left to view members and kanban tasks.
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Collaborative Project"
        subtitle="Recruit skilled student peers for hackathons, academic capstones, or research."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Project Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Smart Campus AI Attendance & Lecture Companion"
              value={createForm.projectName}
              onChange={e => setCreateForm({ ...createForm, projectName: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Project Type
              </label>
              <select
                value={createForm.projectType}
                onChange={e => setCreateForm({ ...createForm, projectType: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Academic">Academic Capstone</option>
                <option value="Hackathon">Hackathon Sprint</option>
                <option value="Research">Research Lab</option>
                <option value="Open Source">Open Source Contribution</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                GitHub Repository URL
              </label>
              <input
                type="url"
                placeholder="https://github.com/org/repo"
                value={createForm.githubUrl}
                onChange={e => setCreateForm({ ...createForm, githubUrl: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Required Skills (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. React, TypeScript, PyTorch, Docker"
              value={createForm.requiredSkills}
              onChange={e => setCreateForm({ ...createForm, requiredSkills: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description & Teammate Needs *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Describe the system architecture, target deliverables, and specific roles you are looking to fill..."
              value={createForm.description}
              onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Create Project
            </button>
          </div>
        </form>
      </Modal>

      {/* Join Request Message Modal */}
      <Modal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        title="Request to Join Team"
        subtitle={activeProject ? `Applying for: ${activeProject.projectName}` : ''}
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Your Contribution Pitch
            </label>
            <textarea
              rows={3}
              placeholder="Explain which technologies you know, your availability, and why you are interested in this project..."
              value={joinMessage}
              onChange={e => setJoinMessage(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={() => setIsJoinModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => activeProject && handleRequestJoin(activeProject.id)}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Submit Request
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
