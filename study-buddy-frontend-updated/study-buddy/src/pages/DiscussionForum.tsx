import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { Discussion } from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import {
  MessageSquare,
  Plus,
  ThumbsUp,
  CheckCircle,
  Flag,
  Search,
  Send,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

export const DiscussionForum: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [discussions, setDiscussions] = useState<Discussion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Active question expansion
  const [expandedDiscussionId, setExpandedDiscussionId] = useState<string | null>(null);
  const [replyInput, setReplyInput] = useState('');

  // Ask Question Modal
  const [isAskModalOpen, setIsAskModalOpen] = useState(false);
  const [askForm, setAskForm] = useState({
    title: '',
    content: '',
    subject: 'Database Management Systems',
  });

  const loadDiscussions = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedSubject) params.subject = selectedSubject;
      if (searchQuery) params.keyword = searchQuery;

      const data = await api.getDiscussions(params);
      setDiscussions(data);
      if (data.length > 0 && !expandedDiscussionId) {
        setExpandedDiscussionId(data[0].id);
      }
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error loading doubts', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDiscussions();
  }, [selectedSubject, searchQuery]);

  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askForm.title || !askForm.content) {
      addToast({ type: 'error', title: 'Missing fields', message: 'Title and content are required' });
      return;
    }

    try {
      const created = await api.createDiscussion(askForm);
      addToast({
        type: 'success',
        title: 'Doubt Posted!',
        message: 'Your question is now visible to peer students and instructors (+10 points).',
      });
      setIsAskModalOpen(false);
      setDiscussions(prev => [created, ...prev]);
      setExpandedDiscussionId(created.id);
      setAskForm({
        title: '',
        content: '',
        subject: 'Database Management Systems',
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Post error', message: err.message });
    }
  };

  const handleReplySubmit = async (discussionId: string) => {
    if (!replyInput.trim()) return;

    try {
      const newAnswer = await api.replyToDiscussion(discussionId, replyInput.trim());
      addToast({
        type: 'success',
        title: 'Answer Posted!',
        message: 'You earned +15 contribution points for answering a classmate doubt.',
      });
      setDiscussions(prev =>
        prev.map(d =>
          d.id === discussionId ? { ...d, answers: [...d.answers, newAnswer] } : d
        )
      );
      setReplyInput('');
    } catch (err: any) {
      addToast({ type: 'error', title: 'Reply error', message: err.message });
    }
  };

  const handleVoteDiscussion = async (discussionId: string) => {
    try {
      const res = await api.voteDiscussion(discussionId);
      setDiscussions(prev =>
        prev.map(d => (d.id === discussionId ? { ...d, upvotes: res.upvotes } : d))
      );
    } catch (err: any) {
      addToast({ type: 'error', title: 'Vote error', message: err.message });
    }
  };

  const handleAcceptAnswer = async (discussionId: string, answerId: string) => {
    try {
      const res = await api.acceptDiscussionAnswer(discussionId, answerId);
      addToast({
        type: 'success',
        title: 'Answer Accepted!',
        message: 'Marked as the verified accepted solution (+25 points awarded to author).',
      });
      setDiscussions(prev =>
        prev.map(d => (d.id === discussionId ? res.discussion : d))
      );
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const handleReport = async (discussionId: string) => {
    if (!confirm('Flag this discussion thread for moderation?')) return;
    try {
      await api.reportDiscussion(discussionId);
      addToast({ type: 'info', title: 'Flagged for moderation' });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const activeDiscussion = discussions.find(d => d.id === expandedDiscussionId);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Doubt Discussion Forum
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Ask technical doubts, verify exam solutions, and earn contribution points by helping classmates.
          </p>
        </div>

        <button
          onClick={() => setIsAskModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs inline-flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Ask a Question
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search discussions by topic, question, or keyword..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <select
          value={selectedSubject}
          onChange={e => setSelectedSubject(e.target.value)}
          className="px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none"
        >
          <option value="">All Subjects</option>
          <option value="Database Management Systems">Database Management Systems</option>
          <option value="Operating Systems">Operating Systems</option>
          <option value="Algorithms">Design & Analysis of Algorithms</option>
          <option value="Computer Networks">Computer Networks</option>
          <option value="Compiler Design">Compiler Design</option>
        </select>
      </div>

      {/* Main Forum Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Question List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
              ))}
            </div>
          ) : discussions.length === 0 ? (
            <EmptyState
              title="No doubt questions found"
              description="Got an assignment doubt or tricky exam problem? Ask the student community."
              actionText="Ask First Question"
              onAction={() => setIsAskModalOpen(true)}
            />
          ) : (
            discussions.map(d => {
              const isSelected = d.id === expandedDiscussionId;

              return (
                <div
                  key={d.id}
                  onClick={() => setExpandedDiscussionId(d.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-white ring-1 ring-indigo-600 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-indigo-700">{d.subject}</span>
                    <span className="text-[11px] text-slate-400">
                      {new Date(d.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1.5 line-clamp-2 leading-snug">
                    {d.title}
                  </h3>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                    <span>By {d.authorName}</span>
                    <div className="flex items-center gap-3">
                      <span className="tabular-nums">▲ {d.upvotes}</span>
                      <span className="tabular-nums">{d.answers.length} answers</span>
                      {d.isResolved && (
                        <span title="Resolved">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Expanded Thread & Answers (7 cols) */}
        <div className="lg:col-span-7">
          {activeDiscussion ? (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs p-6 space-y-6">
              {/* Question Header */}
              <div className="space-y-3 pb-4 border-b border-slate-100">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-indigo-700">{activeDiscussion.subject}</span>
                    <span>·</span>
                    <span>Asked by {activeDiscussion.authorName}</span>
                  </div>
                  <button
                    onClick={() => handleReport(activeDiscussion.id)}
                    className="text-slate-400 hover:text-rose-600 transition-colors"
                    title="Report question"
                  >
                    <Flag className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h2 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                  {activeDiscussion.title}
                </h2>

                <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                  {activeDiscussion.content}
                </p>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={() => handleVoteDiscussion(activeDiscussion.id)}
                    className="px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-slate-500" />
                    <span>Upvote ({activeDiscussion.upvotes})</span>
                  </button>
                </div>
              </div>

              {/* Answers List */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Answers ({activeDiscussion.answers.length})
                </h3>

                {activeDiscussion.answers.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                    No answers yet. Share your understanding below!
                  </div>
                ) : (
                  activeDiscussion.answers.map(ans => {
                    const isAuthor =
                      activeDiscussion.authorId === user?.id || user?.role === 'ADMIN';

                    return (
                      <div
                        key={ans.id}
                        className={`p-4 rounded-xl border text-xs sm:text-sm space-y-2.5 transition-colors ${
                          ans.isAccepted
                            ? 'bg-emerald-50/50 border-emerald-300 ring-1 ring-emerald-400'
                            : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span className="font-bold text-slate-900">{ans.authorName}</span>
                          <div className="flex items-center gap-2">
                            {ans.isAccepted ? (
                              <span className="text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" /> Accepted Answer
                              </span>
                            ) : (
                              isAuthor && (
                                <button
                                  onClick={() =>
                                    handleAcceptAnswer(activeDiscussion.id, ans.id)
                                  }
                                  className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                                >
                                  Mark as Accepted
                                </button>
                              )
                            )}
                          </div>
                        </div>

                        <p className="text-slate-800 leading-relaxed whitespace-pre-line text-xs">
                          {ans.content}
                        </p>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Answer Input Form */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Your Answer
                </h4>
                <textarea
                  rows={3}
                  placeholder="Provide a step-by-step technical explanation, proof, or code example..."
                  value={replyInput}
                  onChange={e => setReplyInput(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={() => handleReplySubmit(activeDiscussion.id)}
                  disabled={!replyInput.trim()}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  Post Answer (+15 pts)
                </button>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
              Select a question on the left to read answers.
            </div>
          )}
        </div>
      </div>

      {/* Ask Question Modal */}
      <Modal
        isOpen={isAskModalOpen}
        onClose={() => setIsAskModalOpen(false)}
        title="Ask an Academic Doubt"
        subtitle="Post your question to fellow classmates and teaching assistants."
      >
        <form onSubmit={handleAskSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Course Subject *
            </label>
            <select
              value={askForm.subject}
              onChange={e => setAskForm({ ...askForm, subject: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
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
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Question Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Why does Rigorous 2PL prevent cascading aborts but not deadlocks?"
              value={askForm.title}
              onChange={e => setAskForm({ ...askForm, title: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Detailed Explanation / Code / Schedule *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Describe what you tried, the conflicting schedule or theorem, and what specifically is confusing..."
              value={askForm.content}
              onChange={e => setAskForm({ ...askForm, content: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAskModalOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs"
            >
              Submit Question
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
