import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Workspace } from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import {
  Users2,
  Plus,
  KeyRound,
  Calendar,
  ArrowRight,
} from 'lucide-react';

interface WorkspacesProps {
  onSelectWorkspace: (workspaceId: string) => void;
}

const SUBJECTS = [
  { label: 'Java', value: 'JAVA' },
  { label: 'DBMS', value: 'DBMS' },
  { label: 'Operating Systems', value: 'OPERATING_SYSTEMS' },
  { label: 'Computer Networks', value: 'COMPUTER_NETWORKS' },
  { label: 'Data Structures', value: 'DATA_STRUCTURES' },
  { label: 'Algorithms', value: 'ALGORITHMS' },
  { label: 'Cyber Security', value: 'CYBER_SECURITY' },
  { label: 'Internet of Things', value: 'INTERNET_OF_THINGS' },
  { label: 'Software Engineering', value: 'SOFTWARE_ENGINEERING' },
  { label: 'Other', value: 'OTHER' },
];

export const Workspaces: React.FC<WorkspacesProps> = ({ onSelectWorkspace }) => {
  const { addToast } = useToast();

  const [userWorkspaces, setUserWorkspaces] = useState<Workspace[]>([]);
  const [exploreWorkspaces, setExploreWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isJoinCodeModalOpen, setIsJoinCodeModalOpen] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  // Form
  const [newWsForm, setNewWsForm] = useState({
    name: '',
    description: '',
    subject: 'DBMS',
    examDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
    maxMembers: '10',
  });

  const loadWorkspaces = async () => {
    setIsLoading(true);

    try {
      const data = await api.getWorkspaces();

      setUserWorkspaces(Array.isArray(data.userWorkspaces) ? data.userWorkspaces : []);
      setExploreWorkspaces(Array.isArray(data.exploreWorkspaces) ? data.exploreWorkspaces : []);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error loading workspaces',
        message: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspaces();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !newWsForm.name.trim() ||
      !newWsForm.subject ||
      !newWsForm.examDate ||
      !newWsForm.expiryDate
    ) {
      addToast({ type: 'error', title: 'Missing required fields' });
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const examDate = new Date(`${newWsForm.examDate}T00:00:00`);
    const expiryDate = new Date(`${newWsForm.expiryDate}T00:00:00`);
    const maxMembers = Number(newWsForm.maxMembers);

    if (examDate < today) {
      addToast({
        type: 'error',
        title: 'Invalid exam date',
        message: 'Exam date must be today or in the future.',
      });
      return;
    }

    if (expiryDate <= today) {
      addToast({
        type: 'error',
        title: 'Invalid expiry date',
        message: 'Expiry date must be in the future.',
      });
      return;
    }

    if (!Number.isInteger(maxMembers) || maxMembers < 2 || maxMembers > 50) {
      addToast({
        type: 'error',
        title: 'Invalid member limit',
        message: 'Maximum members must be between 2 and 50.',
      });
      return;
    }

    try {
      const payload = {
        name: newWsForm.name.trim(),
        description: newWsForm.description.trim(),
        subject: newWsForm.subject,
        examDate: newWsForm.examDate,
        expiryDate: newWsForm.expiryDate,
        maxMembers,
      };

      const created = await api.createWorkspace(payload);

      addToast({
        type: 'success',
        title: 'Study Workspace Created!',
        message: created.joinCode
          ? `Join Code is ${created.joinCode}. Share it with your study partners.`
          : 'Your workspace has been created successfully.',
      });

      setIsCreateModalOpen(false);

      setNewWsForm({
        name: '',
        description: '',
        subject: 'DBMS',
        examDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 21 * 86400000).toISOString().split('T')[0],
        maxMembers: '10',
      });

      await loadWorkspaces();

      if (created.id != null) {
        onSelectWorkspace(String(created.id));
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Creation failed',
        message: err.message,
      });
    }
  };

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();

    const joinCode = joinCodeInput.trim();

    if (!joinCode) return;

    try {
      const res = await api.joinWorkspace({ joinCode });

      addToast({
        type: 'success',
        title: 'Joined Workspace!',
        message: 'You have been added as a member.',
      });

      setIsJoinCodeModalOpen(false);
      setJoinCodeInput('');

      await loadWorkspaces();

      if (res.id != null) {
        onSelectWorkspace(String(res.id));
      }
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Could not join',
        message: err.message,
      });
    }
  };

  const handleDirectJoin = async (wsId: string) => {
    try {
      const res = await api.joinWorkspace({ workspaceId: Number(wsId) });

      addToast({
        type: 'success',
        title: 'Workspace Joined!',
      });

      await loadWorkspaces();

      onSelectWorkspace(String(res.id ?? wsId));
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Join Error',
        message: err.message,
      });
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Collaborative Study Workspaces
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Temporary collaborative exam sprint rooms equipped with shared notes, AI flashcards, mind maps, and live tasks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsJoinCodeModalOpen(true)}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <KeyRound className="w-3.5 h-3.5 text-slate-500" />
            Enter Join Code
          </button>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Create Workspace
          </button>
        </div>
      </div>

      {/* User's Enrolled Workspaces */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            My Enrolled Workspaces ({userWorkspaces.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(n => (
              <div
                key={n}
                className="h-48 bg-white rounded-xl border border-slate-200 animate-pulse"
              />
            ))}
          </div>
        ) : userWorkspaces.length === 0 ? (
          <EmptyState
            title="You haven't joined any study workspaces yet"
            description="Create a workspace for your upcoming mid-semester exam or enter a 6-digit code from your classmates."
            actionText="Create First Workspace"
            onAction={() => setIsCreateModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userWorkspaces.map(ws => {
              const isExpired = new Date(ws.expiryDate) < new Date();

              return (
                <div
                  key={ws.id}
                  onClick={() => onSelectWorkspace(String(ws.id))}
                  className="group cursor-pointer bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-indigo-400 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                        {ws.subject}
                      </span>
                      {isExpired ? (
                        <span className="text-[10px] font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Archived (Read-Only)
                        </span>
                      ) : (
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Code: {ws.joinCode}
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {ws.name}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                      {ws.description || 'Sprint study group for syllabus mastery and AI quizzes.'}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Users2 className="w-3.5 h-3.5 text-slate-400" />
                        <span className="tabular-nums">
                          {ws.memberIds?.length || 1} / {ws.maxMembers} Members
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-600 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>Exam: {ws.examDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Expires: {ws.expiryDate}</span>
                      <span className="font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                        Enter Workspace <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Explore Campus Workspaces */}
      {exploreWorkspaces.length > 0 && (
        <section className="space-y-4 pt-4 border-t border-slate-200">
          <h2 className="text-base font-bold text-slate-900 tracking-tight">
            Explore Open Campus Workspaces
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {exploreWorkspaces.map(ws => (
              <div
                key={ws.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
                      {ws.subject}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Created by {ws.creatorName}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mt-2">{ws.name}</h3>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {ws.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 tabular-nums">
                    {ws.memberIds?.length || 1} / {ws.maxMembers} Members
                  </span>
                  <button
                    onClick={() => handleDirectJoin(String(ws.id))}
                    className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                  >
                    Join Room
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Create Workspace Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Study Workspace"
        subtitle="Set up a collaborative preparation room with your peers."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Workspace Name *
            </label>
            <input
              type="text"
              required
              maxLength={150}
              placeholder="e.g. DBMS Mid-Sem Sprint 2026"
              value={newWsForm.name}
              onChange={e => setNewWsForm({ ...newWsForm, name: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Course Subject *
              </label>
              <select
                required
                value={newWsForm.subject}
                onChange={e => setNewWsForm({ ...newWsForm, subject: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {SUBJECTS.map(subject => (
                  <option key={subject.value} value={subject.value}>
                    {subject.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Max Student Members
              </label>
              <input
                type="number"
                min="2"
                max="50"
                required
                value={newWsForm.maxMembers}
                onChange={e => setNewWsForm({ ...newWsForm, maxMembers: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Target Exam Date *
              </label>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={newWsForm.examDate}
                onChange={e => setNewWsForm({ ...newWsForm, examDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Workspace Expiry Date *
              </label>
              <input
                type="date"
                required
                min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
                value={newWsForm.expiryDate}
                onChange={e => setNewWsForm({ ...newWsForm, expiryDate: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
              <p className="text-[10px] text-slate-400 mt-1">
                After this date, the room automatically becomes read-only and archived.
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description & Objectives
            </label>
            <textarea
              rows={2}
              maxLength={1000}
              placeholder="Syllabus focus: e.g. covering Units 3-5, practicing past exam problems, and generating AI flashcards..."
              value={newWsForm.description}
              onChange={e => setNewWsForm({ ...newWsForm, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Launch Workspace
            </button>
          </div>
        </form>
      </Modal>

      {/* Join Code Modal */}
      <Modal
        isOpen={isJoinCodeModalOpen}
        onClose={() => setIsJoinCodeModalOpen(false)}
        title="Enter Workspace Join Code"
        subtitle="Ask the workspace creator for their 6-character room code."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleJoinByCode} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              6-Character Join Code
            </label>
            <input
              type="text"
              required
              maxLength={8}
              placeholder="e.g. DBMS26"
              value={joinCodeInput}
              onChange={e => setJoinCodeInput(e.target.value.toUpperCase())}
              className="w-full px-4 py-2.5 text-center text-lg font-mono font-bold tracking-widest border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsJoinCodeModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Join Room
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};