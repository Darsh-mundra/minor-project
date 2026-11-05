import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { ResourceRequest, AcademicResource } from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import {
  HelpCircle,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  BookOpen,
} from 'lucide-react';

export const ResourceRequests: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [requests, setRequests] = useState<ResourceRequest[]>([]);
  const [availableResources, setAvailableResources] = useState<AcademicResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [fulfillModalRequest, setFulfillModalRequest] = useState<ResourceRequest | null>(null);
  const [selectedResourceIdToFulfill, setSelectedResourceIdToFulfill] = useState('');

  // Form State

  const [newRequestForm, setNewRequestForm] = useState({
    title: '',
    description: '',
    subject: 'Database Management Systems',
    unit: 'Unit 4',
  });



  const loadRequestsAndResources = async () => {
    setIsLoading(true);

    try {
      const [reqData, resData] = await Promise.all([
        api.getResourceRequests(),
        api.getResources(),
      ]);

      const items = Array.isArray(reqData)
        ? reqData
        : reqData.content ?? [];

      const mappedRequests: ResourceRequest[] = items.map((r: any) => ({
        id: String(r.requestId),
        title: r.title,
        description: r.detail,
        subject: r.subject,
        unit: r.unit,
        requestedById: String(r.creator?.id ?? ''),
        requestedByName: r.creator?.name ?? 'Unknown',
        status: r.status,
        createdAt: r.createdAt,
      }));

      setRequests(mappedRequests);
      setAvailableResources(Array.isArray(resData) ? resData : []);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error loading requests',
        message: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    loadRequestsAndResources();
  }, []);


  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (
      !newRequestForm.title.trim() ||
      !newRequestForm.subject.trim() ||
      !newRequestForm.unit.trim() ||
      !newRequestForm.description.trim()
    ) {
      addToast({
        type: 'error',
        title: 'Missing fields',
        message: 'Please fill in all required fields.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await api.createResourceRequest({
        title: newRequestForm.title.trim(),
        subject: newRequestForm.subject,
        unit: newRequestForm.unit.trim(),
        detail: newRequestForm.description.trim(),
      });

      const mapped: ResourceRequest = {
        id: String(created.requestId),
        title: created.title,
        description: created.detail,
        subject: created.subject,
        unit: created.unit,
        requestedById: String(created.creator?.id ?? user?.id ?? ''),
        requestedByName: created.creator?.name ?? user?.fullName ?? 'Unknown',
        status: created.status,
        createdAt: created.createdAt,
      };

      setRequests((prev) => [mapped, ...prev]);

      addToast({
        type: 'success',
        title: 'Request posted',
        message: 'Your resource request was posted successfully.',
      });

      setIsCreateModalOpen(false);

      setNewRequestForm({
        title: '',
        description: '',
        subject: 'Database Management Systems',
        unit: 'Unit 4',
      });
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Request failed',
        message: error?.message || 'Unable to post request. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleFulfillSubmit = async () => {
    if (!fulfillModalRequest || !selectedResourceIdToFulfill) {
      addToast({
        type: 'error',
        title: 'Select resource',
        message: 'Please select an existing resource to link.',
      });
      return;
    }

    const selectedResource = availableResources.find(
      r => String(r.id) === selectedResourceIdToFulfill
    );

    if (!selectedResource) {
      addToast({
        type: 'error',
        title: 'Resource not found',
        message: 'Please select a resource again.',
      });
      return;
    }

    try {
      await api.fulfillResourceRequest(
        fulfillModalRequest.id,
        `Provided resource: ${selectedResource.title}`,
        `${selectedResource.title} (Resource ID: ${selectedResource.id})`
      );

      addToast({
        type: 'success',
        title: 'Request Fulfilled!',
        message: 'The fulfillment was saved.',
      });

      setFulfillModalRequest(null);
      setSelectedResourceIdToFulfill('');
      await loadRequestsAndResources();
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message,
      });
    }
  };


  const handleCloseRequest = async (id: string) => {
    try {
      await api.closeResourceRequest(id);
      addToast({ type: 'info', title: 'Request Closed' });
      setRequests(prev =>
        prev.map(r => (r.id === id ? { ...r, status: 'CLOSED' as const } : r))
      );
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message });
    }
  };

  const filteredRequests = requests.filter(r =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.requestedByName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Resource Requests Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Can't find handwritten notes or solutions? Post a request or fulfill one for classmate points.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Request Material
        </button>
      </div>

      {/* Search Input */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search active resource requests by subject, unit, or requester..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Requests List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(n => (
            <div key={n} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <EmptyState
          title="No resource requests match your search"
          description="Looking for specific handwritten notes, question papers, or textbook guides?"
          actionText="Create Resource Request"
          onAction={() => setIsCreateModalOpen(true)}
        />
      ) : (
        <div className="space-y-3">
          {filteredRequests.map(req => {
            const isOwner = req.requestedById === user?.id || user?.role === 'ADMIN';

            return (
              <div
                key={req.id}
                className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-bold text-indigo-700">{req.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span>{req.unit}</span>
                    <span aria-hidden="true">·</span>
                    <span>Requested by {req.requestedByName}</span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(req.createdAt).toLocaleDateString()}</span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug">{req.title}</h3>
                  {req.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {req.description}
                    </p>
                  )}
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {req.status === 'OPEN' ? (
                    <>
                      <button
                        onClick={() => setFulfillModalRequest(req)}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Fulfill (+30 pts)
                      </button>

                      {isOwner && (
                        <button
                          onClick={() => handleCloseRequest(req.id)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          Close
                        </button>
                      )}
                    </>
                  ) : req.status === 'FULFILLED' ? (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Fulfilled</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Closed</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Request Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Post a Resource Request"
        subtitle="Ask university peers for handwritten notes, PYQ solutions, or lab manuals."
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Request Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Need Compiler Design Unit 4: LR(1) Parser Construction Notes"
              value={newRequestForm.title}
              onChange={e => setNewRequestForm({ ...newRequestForm, title: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Subject *
              </label>
              <select
                value={newRequestForm.subject}
                onChange={e => setNewRequestForm({ ...newRequestForm, subject: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Database Management Systems">Database Management Systems</option>
                <option value="Operating Systems">Operating Systems</option>
                <option value="Algorithms">Design & Analysis of Algorithms</option>
                <option value="Computer Networks">Computer Networks</option>
                <option value="Compiler Design">Compiler Design</option>
                <option value="Computer Architecture">Computer Architecture</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Unit / Topic Scope
              </label>
              <input
                type="text"
                placeholder="e.g. Unit 4 or All Units"
                value={newRequestForm.unit}
                onChange={e => setNewRequestForm({ ...newRequestForm, unit: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Details & Questions Needed
            </label>
            <textarea
              rows={3}
              placeholder="Specify if you need handwritten step-by-step tables, formula sheets, or previous exam solutions..."
              value={newRequestForm.description}
              onChange={e => setNewRequestForm({ ...newRequestForm, description: e.target.value })}
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
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Posting...' : 'Post Request'}
            </button>

          </div>
        </form>
      </Modal>

      {/* Fulfill Request Modal */}
      <Modal
        isOpen={Boolean(fulfillModalRequest)}
        onClose={() => setFulfillModalRequest(null)}
        title="Fulfill Resource Request"
        subtitle={`Linking material for: "${fulfillModalRequest?.title}"`}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Select one of your uploaded resources in <span className="font-bold text-slate-800">{fulfillModalRequest?.subject}</span> to fulfill this request. You will earn <span className="font-bold text-indigo-600">+30 contribution points</span>.
          </p>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select Matching Resource
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto">
              {availableResources
                .filter(r => r.subject.toLowerCase() === fulfillModalRequest?.subject.toLowerCase())
                .map(r => (
                  <label
                    key={r.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${selectedResourceIdToFulfill === r.id
                        ? 'border-indigo-600 bg-indigo-50/50'
                        : 'border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <input
                      type="radio"
                      name="fulfill-resource"
                      value={r.id}
                      checked={selectedResourceIdToFulfill === r.id}
                      onChange={() => setSelectedResourceIdToFulfill(r.id)}
                      className="mt-0.5 text-indigo-600"
                    />
                    <div className="text-xs">
                      <p className="font-bold text-slate-900">{r.title}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {r.resourceType} · {r.unit} · By {r.uploaderName}
                      </p>
                    </div>
                  </label>
                ))}

              {availableResources.filter(
                r => r.subject.toLowerCase() === fulfillModalRequest?.subject.toLowerCase()
              ).length === 0 && (
                  <div className="p-4 text-center bg-slate-50 rounded-lg text-xs text-slate-500">
                    No existing resources found matching this subject. Upload new material in the Resource Hub first.
                  </div>
                )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setFulfillModalRequest(null)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleFulfillSubmit}
              disabled={!selectedResourceIdToFulfill}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg disabled:opacity-50"
            >
              Confirm & Fulfill
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
