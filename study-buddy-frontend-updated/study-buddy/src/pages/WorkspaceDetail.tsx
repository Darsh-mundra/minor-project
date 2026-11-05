import React, { useState, useEffect } from 'react';
import { Modal } from '../components/common/Modal';
import { connectWorkspaceDiscussion } from '../services/WorkspaceDisscussion';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../services/api';
import { AcademicResource, Quiz, Flashcard } from '../types';
import {
  Users2,
  Clock,
  BookOpen,
  BrainCircuit,
  Layers,
  Network,
  MessageSquare,
  CheckSquare,
  Sparkles,
  ArrowLeft,
  Copy,
  Plus,
  Send,
  Download,
  AlertTriangle,
  RotateCw,
  Trophy,
  FileText,
Eye,
Share2,
X,
} from 'lucide-react';

interface WorkspaceDetailProps {
  workspaceId: string;
  onBack: () => void;
  onNavigateToQuiz: (quizId?: string) => void;
  onNavigateToFlashcards: () => void;
}

export const WorkspaceDetail: React.FC<WorkspaceDetailProps> = ({
  workspaceId,
  onBack,
  onNavigateToQuiz,
  onNavigateToFlashcards,
}) => {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<any>(null);
  const isWorkspaceCreator = Boolean(
  workspace?.members?.some(
    (member: any) =>
      member.isCreator &&
      String(member.id ?? member.userId) ===
        String(user?.id ?? user?.id)
  )
);
  const { addToast } = useToast();
  const [activeSection, setActiveSection] = useState<
    | 'overview'
    | 'resources'
    | 'quiz'
  //  | 'flashcards'
  //  | 'mindmap'
    | 'discussion'
    | 'tasks'
    | 'members'
    | 'progress'
  //  | 'ai-assistant'
  >('overview');
  const [isLoading, setIsLoading] = useState(true);

  const [chatInput, setChatInput] = useState('');
  const [taskInput, setTaskInput] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const [newMindMapLabel, setNewMindMapLabel] = useState('');
  const [newMindMapParent, setNewMindMapParent] = useState('');
  const [newMindMapNotes, setNewMindMapNotes] = useState('');

  const [flippedCardId, setFlippedCardId] = useState<string | null>(null);
  const [sharedResources, setSharedResources] = useState<any[]>([]);
const [resourceLibrary, setResourceLibrary] = useState<any[]>([]);
const [resourcesLoading, setResourcesLoading] = useState(false);
const [libraryLoading, setLibraryLoading] = useState(false);
const [sharingResourceId, setSharingResourceId] = useState<string | null>(null);
const [previewLoading, setPreviewLoading] = useState(false);
const [previewUrl, setPreviewUrl] = useState<string | null>(null);
const [previewTitle, setPreviewTitle] = useState('');
const [showShareModal, setShowShareModal] = useState(false);

const [resourceShares, setResourceShares] = useState<any[]>([]);
const [resourceShareTitle, setResourceShareTitle] = useState('');
const [resourceShareDescription, setResourceShareDescription] = useState('');
const [resourceShareFiles, setResourceShareFiles] = useState<File[]>([]);
const [resourceShareSubmitting, setResourceShareSubmitting] = useState(false);
const [resourceSharesLoading, setResourceSharesLoading] = useState(false);
const [shareFilePreviewLoading, setShareFilePreviewLoading] = useState<string | null>(null);


  const loadWorkspaceData = async () => {
    try {
      const data = await api.getWorkspaceById(workspaceId);
      setWorkspace(data);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error loading workspace',
        message: err.message,
      });
      onBack();
    } finally {
      setIsLoading(false);
    }
  };

const getItems = (response: any): any[] => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.content)) return response.content;
  if (Array.isArray(response?.items)) return response.items;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.content)) {
    return response.data.content;
  }
  return [];
};

const loadSharedResources = async () => {
  try {
    const response = await api.getWorkspaceResources(
      workspace.id,
      0,
      50
    );

    const items = getItems(response);
    setSharedResources(items);
    return items;
  } catch (error: any) {
    addToast({
      type: 'error',
      title: 'Unable to Load Workspace Resources',
      message: error?.message || 'Please try again.',
    });

    return null;
  }
};


const loadWorkspaceResourceShares = async () => {
  if (!workspace?.id) return;

  setResourceSharesLoading(true);

  try {
    const response = await api.getWorkspaceResourceShares(
      workspace.id,
      0,
      50
    );

    setResourceShares(getItems(response));
  } catch (error: any) {
    addToast({
      type: 'error',
      title: 'Unable to Load Resource Posts',
      message: error?.message || 'Please try again.',
    });
  } finally {
    setResourceSharesLoading(false);
  }
};


const loadResourceLibrary = async () => {
  setLibraryLoading(true);

  try {
    // Always fetch the latest shared resources before filtering.
    const latestSharedResources = await api.getWorkspaceResources(
      workspace.id,
      0,
      50
    );

    const sharedItems = getItems(latestSharedResources);
    setSharedResources(sharedItems);

    const libraryResponse = await api.getResources();
    const libraryItems = getItems(libraryResponse);

    const sharedIds = new Set(
      sharedItems.map((resource: any) =>
        String(
          resource.resourceId ??
          resource.resource?.id ??
          resource.id
        )
      )
    );

    const availableResources = libraryItems.filter(
      (resource: any) =>
        !sharedIds.has(String(resource.id))
    );

    setResourceLibrary(availableResources);
  } catch (error: any) {
    addToast({
      type: 'error',
      title: 'Unable to Load Resource Library',
      message: error?.message || 'Please try again.',
    });
  } finally {
    setLibraryLoading(false);
  }
};

const handleShareResource = async (resourceId: string | number) => {
  if (sharingResourceId !== null) return;

  setSharingResourceId(String(resourceId));

  try {
    await api.shareResourceWithWorkspace(
      workspace.id,
      resourceId
    );

    addToast({
      type: 'success',
      title: 'Resource Shared',
      message: 'The resource was added to this workspace.',
    });

    await loadSharedResources();
    setShowShareModal(false);

    // Refresh the library so the newly shared resource disappears
    // from the list of resources available to share.
    await loadResourceLibrary();
  } catch (error: any) {
    addToast({
      type: 'error',
      title: 'Unable to Share Resource',
      message: error?.message || 'Please try again.',
    });
  } finally {
    setSharingResourceId(null);
  }
};


const handleCreateResourceShare = async (e: React.FormEvent) => {
  e.preventDefault();

  if (resourceShareSubmitting) return;

  const title = resourceShareTitle.trim();
  const description = resourceShareDescription.trim();

  if (!title) {
    addToast({
      type: 'error',
      title: 'Title Required',
      message: 'Enter a title for your resource post.',
    });
    return;
  }

  if (resourceShareFiles.length === 0) {
    addToast({
      type: 'error',
      title: 'PDF Required',
      message: 'Select at least one PDF file.',
    });
    return;
  }

  if (resourceShareFiles.length > 10) {
    addToast({
      type: 'error',
      title: 'Too Many Files',
      message: 'You can upload a maximum of 10 PDFs per post.',
    });
    return;
  }

  const invalidFile = resourceShareFiles.find(
    file => !file.name.toLowerCase().endsWith('.pdf')
  );

  if (invalidFile) {
    addToast({
      type: 'error',
      title: 'Invalid File',
      message: 'Only PDF files are allowed.',
    });
    return;
  }

  setResourceShareSubmitting(true);

  try {
    await api.createWorkspaceResourceShare(
      workspace.id,
      title,
      description,
      resourceShareFiles
    );

    setResourceShareTitle('');
    setResourceShareDescription('');
    setResourceShareFiles([]);

    const fileInput = document.getElementById(
      'workspace-resource-share-files'
    ) as HTMLInputElement | null;

    if (fileInput) fileInput.value = '';

    addToast({
      type: 'success',
      title: 'Resource Post Created',
      message: 'Your PDFs have been shared with the workspace.',
    });

    await loadWorkspaceResourceShares();
  } catch (error: any) {
    addToast({
      type: 'error',
      title: 'Upload Failed',
      message: error?.message || 'Unable to upload the resource post.',
    });
  } finally {
    setResourceShareSubmitting(false);
  }
};


const handlePreviewResource = async (resource: any) => {
  if (previewLoading) return;

  setPreviewLoading(true);

  try {
    const resourceId =
      resource.resourceId ??
      resource.resource?.id ??
      resource.id;

    if (resourceId == null) {
      throw new Error('Resource ID is missing.');
    }

    const blob = await api.previewWorkspaceResource(
      workspace.id,
      resourceId
    );

    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new Error('The server returned an empty PDF.');
    }

    const contentType = blob.type
      .split(';')[0]
      .trim()
      .toLowerCase();

    if (
      contentType &&
      contentType !== 'application/pdf' &&
      contentType !== 'application/octet-stream'
    ) {
      throw new Error('The server did not return a PDF file.');
    }

    const objectUrl = URL.createObjectURL(blob);

    setPreviewTitle(
      resource.title ??
      resource.resource?.title ??
      'Resource Preview'
    );

    setPreviewUrl(objectUrl);
  } catch (error: any) {
    addToast({
      type: 'error',
      title: 'PDF Preview Failed',
      message: error?.message || 'Unable to preview this resource.',
    });
  } finally {
    setPreviewLoading(false);
  }
};

const handlePreviewResourceShareFile = async (
  share: any,
  file: any
) => {
  const workspaceId = workspace?.id ?? workspace?.workspaceId;
  const shareId = share?.id ?? share?.shareId;
  const fileId = file?.id ?? file?.fileId;

  if (
    workspaceId == null ||
    shareId == null ||
    fileId == null
  ) {
    addToast({
      type: 'error',
      title: 'Preview Unavailable',
      message: 'Workspace, resource post, or file ID is missing.',
    });
    return;
  }

  if (shareFilePreviewLoading) return;

  const previewKey = `${shareId}-${fileId}`;
  setShareFilePreviewLoading(previewKey);

  try {
    const blob = await api.previewWorkspaceResourceShareFile(
      workspaceId,
      shareId,
      fileId
    );

    if (!(blob instanceof Blob) || blob.size === 0) {
      throw new Error('The server returned an empty file.');
    }

    const contentType = blob.type
      .split(';')[0]
      .trim()
      .toLowerCase();

    if (
      contentType &&
      contentType !== 'application/pdf' &&
      contentType !== 'application/octet-stream'
    ) {
      throw new Error(
        `Expected a PDF but received "${contentType}".`
      );
    }

    const pdfBlob = new Blob([blob], {
      type: 'application/pdf',
    });

    const objectUrl = URL.createObjectURL(pdfBlob);
    console.log('PDF object URL:', objectUrl);
console.log('PDF blob size:', pdfBlob.size);
console.log('PDF blob type:', pdfBlob.type);

    setPreviewTitle(
      file.originalFilename ??
      file.originalFileName ??
      file.fileName ??
      file.filename ??
      file.name ??
      'Resource PDF'
    );

    setPreviewUrl(objectUrl);
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : 'Unable to preview this PDF.';

    addToast({
      type: 'error',
      title: 'PDF Preview Failed',
      message,
    });
  } finally {
    setShareFilePreviewLoading(null);
  }
};

const closePdfPreview = () => {
  setPreviewUrl((currentUrl) => {
    if (currentUrl) {
      URL.revokeObjectURL(currentUrl);
    }

    return null;
  });

  setPreviewTitle('');
};

useEffect(() => {
  return () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };
}, [previewUrl]);

  useEffect(() => {
    setIsLoading(true);
    loadWorkspaceData();
  }, [workspaceId]);

  useEffect(() => {
    if (!workspace?.id) return;

    const disconnect = connectWorkspaceDiscussion(
      workspace.id,
      (incomingMessage) => {
        setWorkspace((prev: any) => {
          if (!prev) return prev;

          const messages = prev.discussions ?? [];

          const alreadyExists = messages.some(
            (msg: any) => String(msg.id) === String(incomingMessage.id)
          );

          if (alreadyExists) return prev;

          return {
            ...prev,
            discussions: [...messages, incomingMessage],
          };
        });
      },
      (message) => {
        console.error('[Workspace Discussion]', message);
      }
    );

    return disconnect;
  }, [workspace?.id]);

  
useEffect(() => {
  if (activeSection !== 'resources' || !workspace?.id) return;

  loadSharedResources();
  loadWorkspaceResourceShares();
}, [activeSection, workspace?.id]);


  if (isLoading || !workspace) {
    return (
      <div className="p-12 text-center text-slate-500">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-xs">Loading study workspace environment...</p>
      </div>
    );
  }

  const isExpired = new Date(workspace.expiryDate) < new Date();

  // Keep collection values safe when the API returns null or omits them.
  const tasks = workspace.tasks ?? [];
  const resources = sharedResources;
  const quizzes = workspace.quizzes ?? [];
  const flashcards = workspace.flashcards ?? [];
  const discussions = workspace.discussions ?? [];
  const members = workspace.members ?? [];
  const mindMapNodes = workspace.mindMapNodes ?? [];

  const completedTasksCount = tasks.filter(
    (task: any) => task.completed
  ).length;

  const progressPercent =
    tasks.length > 0
      ? Math.round((completedTasksCount / tasks.length) * 100)
      : 0;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(workspace.joinCode);
      addToast({
        type: 'success',
        title: 'Copied Join Code!',
        message: `${workspace.joinCode} copied to clipboard.`,
      });
    } catch {
      addToast({
        type: 'error',
        title: 'Copy Failed',
        message: 'Unable to copy the join code. Please copy it manually.',
      });
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    const content = chatInput.trim();
    if (!content || isExpired) return;

    try {
      const msg = await api.sendWorkspaceMessage(workspace.id, content);

      setWorkspace((prev: any) => {
        if (!prev) return prev;

        const messages = prev.discussions ?? [];

        const alreadyExists = messages.some(
          (item: any) => String(item.id) === String(msg.id)
        );

        if (alreadyExists) return prev;

        return {
          ...prev,
          discussions: [...messages, msg],
        };
      });

      setChatInput('');
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error sending message',
        message: err.message,
      });
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();

    const title = taskInput.trim();
    if (!title || isExpired) return;

    try {
      const task = await api.addWorkspaceTask(workspace.id, {
        title,
        assigneeName: taskAssignee.trim() || user?.fullName,
      });

      setWorkspace((prev: any) => ({
        ...prev,
        tasks: [...(prev.tasks ?? []), task],
      }));

      setTaskInput('');
      setTaskAssignee('');

      addToast({
        type: 'success',
        title: 'Task Added',
        message: 'Workspace task created successfully.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error Adding Task',
        message: err.message,
      });
    }
  };

  const handleToggleTask = async (taskId: string | number) => {
    if (isExpired) return;

    try {
      const updated = await api.toggleWorkspaceTask(
        workspace.id,
        taskId
      );

      setWorkspace((prev: any) => ({
        ...prev,
        tasks: (prev.tasks ?? []).map((task: any) =>
          String(task.id) === String(updated.id) ? updated : task
        ),
      }));
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error Updating Task',
        message: err.message,
      });
    }
  };

  const handleAddMindMapNode = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMindMapLabel.trim() || isExpired) return;

    try {
      const node = await api.addMindMapNode(workspace.id, {
        label: newMindMapLabel.trim(),
        parentId: newMindMapParent || undefined,
        notes: newMindMapNotes || undefined,
      });

      setWorkspace((prev: any) => ({
        ...prev,
        mindMapNodes: [...(prev.mindMapNodes ?? []), node],
      }));

      setNewMindMapLabel('');
      setNewMindMapParent('');
      setNewMindMapNotes('');

      addToast({
        type: 'success',
        title: 'Concept Node Added',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Error',
        message: err.message,
      });
    }
  };

  const handleAskAi = async () => {
    const question = aiQuestion.trim();
    if (!question || aiLoading) return;

    setAiLoading(true);
    setAiAnswer('');

    try {
      const res = await api.askAiAssistant({
        question,
        subject: workspace.subject,
        workspaceContext: `Workspace: ${workspace.name}. Subject: ${workspace.subject}. Scope: ${workspace.description}`,
      });

      setAiAnswer(res.answer);
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'AI Assistant Error',
        message: err.message,
      });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-bold text-indigo-700">
                {workspace.subject}
              </span>
              <span aria-hidden="true">·</span>
              <span>Exam: {workspace.examDate}</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900">
              {workspace.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 shadow-xs"
          >
            <Copy className="w-3.5 h-3.5 text-slate-500" />
            Join Code:{' '}
            <span className="font-mono text-indigo-600">
              {workspace.joinCode}
            </span>
          </button>
        </div>
      </div>

      {/* Expiry Banner */}
      {isExpired && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900">
            <p className="font-bold">Workspace Expired & Archived</p>
            <p className="mt-0.5">
              This study workspace reached its expiry date on{' '}
              {workspace.expiryDate}. All notes, mind maps, quizzes, and
              discussions remain accessible in read-only mode.
            </p>
          </div>
        </div>
      )}

      {/* Section Navigation */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-slate-200 scrollbar-none">
        {[
          { id: 'overview', label: '1. Overview', icon: Users2 },
          { id: 'resources', label: '2. Resources', icon: BookOpen },
          { id: 'quiz', label: '3. Quiz Sprint', icon: BrainCircuit },
  //        { id: 'flashcards', label: '4. Flashcards', icon: Layers },
  //        { id: 'mindmap', label: '5. Mind Map', icon: Network },
          { id: 'discussion', label: '4. Discussion', icon: MessageSquare },
          { id: 'tasks', label: '5. Tasks', icon: CheckSquare },
          { id: 'members', label: '6. Members', icon: Users2 },
          { id: 'progress', label: '7. Progress', icon: Trophy },
    //      { id: 'ai-assistant', label: '10. AI Assistant', icon: Sparkles },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Section 1: Overview */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs space-y-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                About this Sprint Workspace
              </h2>

              <p className="text-xs text-slate-600 leading-relaxed">
                {workspace.description ||
                  'Dedicated study workspace for exam preparation, collaborative question sets, and syllabus review.'}
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Subject
                  </span>
                  <span className="font-bold text-slate-800">
                    {workspace.subject}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Exam Date
                  </span>
                  <span className="font-bold text-slate-800">
                    {workspace.examDate}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">
                    Creator
                  </span>
                  <span className="font-bold text-slate-800">
                    {workspace.creatorName}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => setActiveSection('resources')}
                className="cursor-pointer p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 transition-all"
              >
                <BookOpen className="w-5 h-5 text-indigo-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900">
                  Workspace Resources
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {resources.length} documents aligned
                </p>
              </div>

              <div
                onClick={() => setActiveSection('quiz')}
                className="cursor-pointer p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 transition-all"
              >
                <BrainCircuit className="w-5 h-5 text-indigo-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900">
                  AI MCQ Quizzes
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {quizzes.length} active test suites
                </p>
              </div>

              <div
       //         onClick={() => setActiveSection('flashcards')}
                className="cursor-pointer p-4 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 transition-all"
              >
                <Layers className="w-5 h-5 text-indigo-600 mb-2" />
                <h4 className="text-xs font-bold text-slate-900">
                  Study Flashcards
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {flashcards.length} key concepts
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-md">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="uppercase tracking-wider font-semibold text-indigo-400">
                  Target Exam
                </span>
                <Clock className="w-4 h-4 text-indigo-400" />
              </div>

              <p className="text-xl font-extrabold text-white">
                {workspace.examDate}
              </p>

              <p className="text-xs text-slate-300 mt-1">
                Collaborate on revision checklists and take tests before the
                exam date.
              </p>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Study Group ({members.length || 1})
                </h3>

                <button
                  onClick={() => setActiveSection('members')}
                  className="text-xs text-indigo-600 font-semibold"
                >
                  View All
                </button>
              </div>

              <div className="space-y-2">
                {members.slice(0, 4).map((m: any) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-800">
                      {m.fullName}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {m.points} pts
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Section 2: Resources */}
      

{activeSection === 'resources' && (
  <div className="space-y-5 animate-in fade-in duration-150">
    {/* Header and Share button */}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="text-base font-bold text-slate-900">
          Workspace Resources ({sharedResources.length})
        </h2>
        <p className="mt-1 text-xs text-slate-500">
          Resources shared with this study workspace.
        </p>
      </div>

      {!isExpired && (
        <button
          type="button"
          onClick={() => setShowShareModal(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
        >
          <Share2 className="h-4 w-4" />
          Share Workspace
        </button>
      )}
    </div>

    {/* Share form: shown only inside the modal */}
    {showShareModal && !isExpired && (
      <Modal
        isOpen={showShareModal}
        onClose={() => {
          if (resourceShareSubmitting) return;
          setShowShareModal(false);
        }}
        title="Share Workspace Resources"
        subtitle="Create one post and attach multiple PDF files."
      >
        <form
          onSubmit={handleCreateResourceShare}
          className="space-y-4"
        >
          <div>
            <label
              htmlFor="workspace-resource-title"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Post title *
            </label>
            <input
              id="workspace-resource-title"
              type="text"
              value={resourceShareTitle}
              onChange={(e) => setResourceShareTitle(e.target.value)}
              placeholder="Enter resource topic or title"
              maxLength={150}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="workspace-resource-description"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Description
            </label>
            <textarea
              id="workspace-resource-description"
              value={resourceShareDescription}
              onChange={(e) =>
                setResourceShareDescription(e.target.value)
              }
              placeholder="Explain what these resources cover"
              rows={3}
              maxLength={2000}
              className="w-full resize-y rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            />
          </div>

          <div>
            <label
              htmlFor="workspace-resource-files"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              PDF attachments * (maximum 10 files, 25 MB each)
            </label>
            <input
              id="workspace-resource-files"
              type="file"
              accept=".pdf,application/pdf"
              multiple
              required={resourceShareFiles.length === 0}
              onChange={(e) => {
                const selectedFiles = Array.from(
                  e.target.files ?? []
                );

                if (selectedFiles.length > 10) {
                  addToast({
                    type: 'error',
                    title: 'Too many files',
                    message: 'You can attach a maximum of 10 PDF files.',
                  });
                  e.target.value = '';
                  return;
                }

                const invalidFile = selectedFiles.find(
                  (file) =>
                    file.type !== 'application/pdf' &&
                    !file.name.toLowerCase().endsWith('.pdf')
                );

                if (invalidFile) {
                  addToast({
                    type: 'error',
                    title: 'Invalid file',
                    message: 'Only PDF files are allowed.',
                  });
                  e.target.value = '';
                  return;
                }

                const oversizedFile = selectedFiles.find(
                  (file) => file.size > 25 * 1024 * 1024
                );

                if (oversizedFile) {
                  addToast({
                    type: 'error',
                    title: 'File too large',
                    message: 'Each PDF must be 25 MB or smaller.',
                  });
                  e.target.value = '';
                  return;
                }

                setResourceShareFiles((previous) => {
  const mergedFiles = [...previous];

  for (const file of selectedFiles) {
    const alreadyAdded = mergedFiles.some(
      (existing) =>
        existing.name === file.name &&
        existing.size === file.size &&
        existing.lastModified === file.lastModified
    );

    if (!alreadyAdded) {
      mergedFiles.push(file);
    }
  }

  return mergedFiles.slice(0, 10);
});
              }}
              className="block w-full rounded-lg border border-slate-300 bg-white p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-indigo-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-indigo-700"
            />

            <p className="mt-1 text-xs text-slate-500">
              Select up to 10 PDFs together. Selecting files again
              replaces the current selection.
            </p>
          </div>

          {resourceShareFiles.length > 0 && (
            <div className="space-y-2 rounded-lg border border-slate-200 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800">
                  Selected PDFs ({resourceShareFiles.length}/10)
                </p>

                <button
                  type="button"
                  onClick={() => {
                    setResourceShareFiles([]);
                    const input = document.getElementById(
                      'workspace-resource-files'
                    ) as HTMLInputElement | null;

                    if (input) input.value = '';
                  }}
                  className="text-xs font-medium text-red-600 hover:text-red-700"
                >
                  Remove all
                </button>
              </div>

              {resourceShareFiles.map((file, index) => (
                <div
                  key={`${file.name}-${file.size}-${index}`}
                  className="flex items-center justify-between gap-3 rounded-md bg-slate-50 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm text-slate-700">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setResourceShareFiles((previous) =>
                        previous.filter((_, i) => i !== index)
                      );

                      const input = document.getElementById(
                        'workspace-resource-files'
                      ) as HTMLInputElement | null;

                      if (input) input.value = '';
                    }}
                    aria-label={`Remove ${file.name}`}
                    className="shrink-0 rounded-md px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              disabled={resourceShareSubmitting}
              onClick={() => {
                setShowShareModal(false);
                setResourceShareTitle('');
                setResourceShareDescription('');
                setResourceShareFiles([]);
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={
                resourceShareSubmitting ||
                !resourceShareTitle.trim() ||
                resourceShareFiles.length === 0
              }
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {resourceShareSubmitting ? 'Sharing...' : 'Share Resources'}
            </button>
          </div>
        </form>
      </Modal>
    )}

    {/* Workspace resource posts */}
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-slate-800">
        Workspace Posts
      </h3>

      {resourceSharesLoading ? (
        <div className="rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-500">
          Loading workspace posts...
        </div>
      ) : resourceShares.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
          <p className="text-sm font-medium text-slate-700">
            No workspace posts yet
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Share a title, description and PDF attachments with this workspace.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {resourceShares.map((share: any) => {
            const files = Array.isArray(share.files)
              ? share.files
              : Array.isArray(share.attachments)
                ? share.attachments
                : [];

            return (
              <article
                key={share.id ?? share.shareId}
                className="rounded-xl border border-slate-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="break-words text-sm font-bold text-slate-900">
                      {share.title ?? 'Untitled resource'}
                    </h4>
                    <p className="mt-1 text-xs text-slate-500">
                      Shared by{' '}
                      {share.sharedByName ??
                        share.uploaderName ??
                        share.createdByName ??
                        share.authorName ??
                        'Workspace member'}
                    </p>
                  </div>

                  <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                    {files.length} PDF{files.length === 1 ? '' : 's'}
                  </span>
                </div>

                {share.description && (
                  <p className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-600">
                    {share.description}
                  </p>
                )}

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {files.map((file: any, index: number) => {
                      const fileId = file.id ?? file.fileId;
                      const fileName =
                        file.originalFileName ??
                        file.fileName ??
                        file.name ??
                        `Resource ${index + 1}.pdf`;

                      return (
                        <div
                          key={fileId ?? `${fileName}-${index}`}
                          className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-slate-50 p-3"
                        >
                          <div className="min-w-0">
                            <p className="break-all text-sm font-medium text-slate-700">
                              {fileName}
                            </p>
                            <p className="text-xs text-slate-500">
                              PDF · Preview only
                            </p>
                          </div>

                          <button
                            type="button"
                            disabled={
                              fileId == null ||
                              shareFilePreviewLoading ===
                                `${share.id ?? share.shareId}-${fileId}`
                            }
                            onClick={() =>
                              handlePreviewResourceShareFile(share, file)
                            }
                            className="shrink-0 rounded-lg border border-indigo-200 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {shareFilePreviewLoading ===
                            `${share.id ?? share.shareId}-${fileId}`
                              ? 'Opening...'
                              : 'Preview PDF'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>

    {/* Existing ResourceHub shares - keep this listing */}
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-slate-800">
        ResourceHub Resources
      </h3>

      {sharedResources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center">
          <p className="text-sm text-slate-500">
            No ResourceHub resources are available here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {sharedResources.map((res: any, index: number) => (
            <article
              key={res.id ?? res.resourceId ?? index}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <h4 className="break-words text-sm font-bold text-slate-900">
                {res.title ?? res.name ?? 'Untitled resource'}
              </h4>

              {(res.description || res.subject) && (
                <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">
                  {res.description ?? res.subject}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-500">
                  {res.uploaderName ??
                    res.sharedByName ??
                    res.uploadedByName ??
                    'ResourceHub'}
                </span>

                <button
                  type="button"
                  onClick={() => handlePreviewResource(res)}
                  className="rounded-lg border border-indigo-200 px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                >
                  Preview PDF
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  </div>
)}



      {/* Section 3: Quiz Sprint */}
      
{activeSection === 'quiz' && (
  <div className="space-y-4 animate-in fade-in duration-150">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-base font-bold text-slate-900">
          Workspace Quizzes ({quizzes.length})
        </h2>
        <p className="text-xs text-slate-500">
          Multiple-choice tests designed for {workspace.subject}
        </p>
      </div>

      <button
        onClick={() => onNavigateToQuiz(quizzes[0]?.id)}
        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-xs inline-flex items-center gap-1.5"
      >
        <BrainCircuit className="w-3.5 h-3.5" />
        Take or Generate Quiz
      </button>
    </div>

    {quizzes.length === 0 ? (
      <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
        <BrainCircuit className="w-8 h-8 text-slate-400 mx-auto mb-2" />

        <p className="text-xs font-bold text-slate-800">
          No quizzes available yet
        </p>

        <p className="text-xs text-slate-500 mt-1">
          Generate a quiz to start practising.
        </p>
      </div>
    ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quizzes.map((q: Quiz) => (
          <div
            key={q.id}
            className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-indigo-700">
                  {q.topic}
                </span>

                <span>{q.difficulty}</span>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mt-1.5">
                {q.title}
              </h3>

              <p className="text-xs text-slate-500 mt-1">
                {q.questions?.length ?? 0} Questions with detailed
                step-by-step explanations.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                By {q.creatorName}
              </span>

              <button
                onClick={() => onNavigateToQuiz(q.id)}
                className="px-3 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
              >
                Start Test
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
)}


      {/* Section 4: Flashcards }
      {activeSection === 'flashcards' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Study Flashcards ({flashcards.length})
              </h2>
              <p className="text-xs text-slate-500">
                Click any card to flip and verify your understanding
              </p>
            </div>

            <button
              onClick={onNavigateToFlashcards}
              className="px-3.5 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg inline-flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Generate More Flashcards
            </button>
          </div>

          {flashcards.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-slate-300">
              <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-800">
                No flashcards available yet
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Generate flashcards to revise key concepts.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {flashcards.map((fc: Flashcard) => {
                const isFlipped = String(flippedCardId) === String(fc.id);

                return (
                  <div
                    key={fc.id}
                    onClick={() =>
                      setFlippedCardId(isFlipped ? null : String(fc.id))
                    }
                    className={`cursor-pointer p-5 rounded-xl border min-h-[160px] flex flex-col justify-between transition-all ${
                      isFlipped
                        ? 'bg-slate-900 text-white border-slate-800'
                        : 'bg-white text-slate-900 border-slate-200 hover:border-indigo-400 shadow-xs'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span
                        className={
                          isFlipped
                            ? 'text-indigo-300 font-semibold'
                            : 'text-indigo-600 font-semibold'
                        }
                      >
                        {isFlipped
                          ? 'Answer / Explanation'
                          : 'Front / Concept'}
                      </span>
                      <span className="text-slate-400">
                        {fc.difficulty}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-semibold my-auto leading-relaxed">
                      {isFlipped ? fc.back : fc.front}
                    </p>

                    <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100/30">
                      <span className="text-slate-400">
                        Click to {isFlipped ? 'see question' : 'flip answer'}
                      </span>
                      <RotateCw className="w-3 h-3 opacity-60" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )*/}

      {/* Section 5: Mind Map }
      {activeSection === 'mindmap' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Hierarchical Mind Map
              </h2>
              <p className="text-xs text-slate-500">
                Collaborative conceptual tree for {workspace.subject}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="space-y-2">
                {mindMapNodes.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">
                    No mind map concepts added yet.
                  </p>
                ) : (
                  mindMapNodes.map((node: any) => {
                    const isRoot = !node.parentId;

                    return (
                      <div
                        key={node.id}
                        className={`p-3 rounded-lg border transition-colors ${
                          isRoot
                            ? 'bg-indigo-50/80 border-indigo-200 font-bold text-indigo-900 ml-0'
                            : 'bg-slate-50 border-slate-200 text-slate-800 ml-6'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold">{node.label}</span>
                          {node.parentId && (
                            <span className="text-[10px] text-slate-400">
                              Child Node
                            </span>
                          )}
                        </div>

                        {node.notes && (
                          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                            {node.notes}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
                Add Concept Node
              </h3>

              {!isExpired ? (
                <form onSubmit={handleAddMindMapNode} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Concept Node Label *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Concurrency Control"
                      value={newMindMapLabel}
                      onChange={(e) => setNewMindMapLabel(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Parent Concept
                    </label>
                    <select
                      value={newMindMapParent}
                      onChange={(e) => setNewMindMapParent(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="">Top Level (Root)</option>
                      {mindMapNodes.map((n: any) => (
                        <option key={n.id} value={n.id}>
                          {n.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Notes / Key Theorems
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Summary bullet points or formulas..."
                      value={newMindMapNotes}
                      onChange={(e) => setNewMindMapNotes(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
                  >
                    Add to Mind Map
                  </button>
                </form>
              ) : (
                <p className="text-xs text-slate-400">
                  Workspace is archived (read-only).
                </p>
              )}
            </div>
          </div>
        </div>
      )*/}

      {/* Section 6: Discussion */}
      {activeSection === 'discussion' && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs flex flex-col h-[520px] animate-in fade-in duration-150">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Workspace Discussion Stream ({discussions.length})
            </h3>
            <span className="text-xs text-slate-400">
              Live peer collaboration
            </span>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {discussions.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No messages yet. Post a doubt or share a resource link!
              </div>
            ) : (
              discussions.map((msg: any) => (
                <div
                  key={msg.id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                >
                  <div className="flex items-center justify-between text-slate-500 mb-1">
                    <span className="font-bold text-slate-900">
                      {msg.authorName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {msg.createdAt
                        ? new Date(msg.createdAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : ''}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              ))
            )}
          </div>

          {!isExpired ? (
            <form
              onSubmit={handleSendMessage}
              className="p-3 border-t border-slate-100 flex gap-2"
            >
              <input
                type="text"
                placeholder="Type your message or doubt to study partners..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                Send
              </button>
            </form>
          ) : (
            <div className="p-3 text-center text-xs text-slate-400 bg-slate-50">
              Archived workspace. Discussions are locked.
            </div>
          )}
        </div>
      )}

      {/* Section 7: Tasks */}
      {activeSection === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
          <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Collaborative Exam Tasks ({completedTasksCount}/{tasks.length}{' '}
              Completed)
            </h3>

            <div className="space-y-2">
              {tasks.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-slate-300 rounded-xl">
                  <CheckSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-800">
                    No tasks yet
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Add a task to track your exam preparation.
                  </p>
                </div>
              ) : (
                tasks.map((task: any) => (
                  <div
                    key={task.id}
                    onClick={() =>
                      !isExpired && handleToggleTask(task.id)
                    }
                    className={`p-3 rounded-lg border flex items-center justify-between gap-3 transition-colors ${
                      isExpired
                        ? 'cursor-default'
                        : 'cursor-pointer hover:bg-slate-50'
                    } ${
                      task.completed
                        ? 'bg-slate-50/60 border-slate-200 text-slate-400 line-through'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(task.completed)}
                        readOnly
                        className="rounded text-indigo-600 focus:ring-0"
                      />
                      <span className="text-xs font-semibold">
                        {task.title}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 shrink-0">
                      <span>{task.assigneeName || 'Unassigned'}</span>
                      {task.dueDate && (
                        <>
                          {' · '}
                          <span>Due {task.dueDate}</span>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Add New Task
            </h3>

            {!isExpired ? (
              <form onSubmit={handleAddTask} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Task Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Review B+ Tree practice problems"
                    value={taskInput}
                    onChange={(e) => setTaskInput(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Assignee Name
                  </label>
                  <input
                    type="text"
                    placeholder={user?.fullName || 'Assignee'}
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!taskInput.trim()}
                  className="w-full py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
                >
                  Add Task
                </button>
              </form>
            ) : (
              <p className="text-xs text-slate-400">
                Workspace is archived (read-only).
              </p>
            )}
          </div>
        </div>
      )}

      {/* Section 8: Members */}
      {activeSection === 'members' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs animate-in fade-in duration-150">
          <h2 className="text-base font-bold text-slate-900 mb-4">
            Workspace Members ({members.length || 1})
          </h2>

          <div className="divide-y divide-slate-100">
            {members.length === 0 ? (
              <p className="py-6 text-center text-xs text-slate-400">
                No member details available.
              </p>
            ) : (
              members.map((m: any) => (
                <div
                  key={m.id}
                  className="py-3 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={
                        m.avatarUrl ||
                        '/src/assets/images/avatar_student_sarah_1791044501841.jpg'
                      }
                      alt={m.fullName || 'Workspace member'}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src =
                          'https://api.dicebear.com/7.x/bottts/svg?seed=student';
                      }}
                    />

                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        {m.fullName}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {m.branch} · Semester {m.semester}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-indigo-600 tabular-nums">
                      {m.points ?? 0} points
                    </span>

                    {m.isCreator && (
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        Room Creator
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Section 9: Progress */}
      {activeSection === 'progress' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-150">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs md:col-span-2 space-y-4">
            <h2 className="text-base font-bold text-slate-900">
              Exam Readiness Meter
            </h2>

            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-600 font-medium">
                <span>Task Completion</span>
                <span className="tabular-nums font-bold text-indigo-600">
                  {progressPercent}%
                </span>
              </div>

              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 text-[11px]">
                  Tasks Completed
                </p>
                <p className="text-xl font-bold text-slate-900 tabular-nums">
                  {completedTasksCount} / {tasks.length}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-[11px]">Exam Date</p>
                <p className="text-xl font-bold text-slate-900">
                  {workspace.examDate}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-indigo-900 text-white p-5 rounded-xl border border-indigo-800 shadow-xs space-y-2">
            <Trophy className="w-6 h-6 text-amber-400 mb-1" />

            <h3 className="text-sm font-bold">
              Collaborative Milestone
            </h3>

            <p className="text-xs text-indigo-200 leading-relaxed">
              Your study group has completed {completedTasksCount} preparation
              milestones. Practice with the AI Quiz suite to maximize retention.
            </p>
          </div>
        </div>
      )}



      {/* Section 10: AI Assistant }
      {activeSection === 'ai-assistant' && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div>
            <div className="inline-flex items-center gap-1.5 text-indigo-600 text-xs font-bold mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Workspace AI Tutor</span>
            </div>

            <h2 className="text-base font-bold text-slate-900">
              Context-Aware Study Assistant for {workspace.subject}
            </h2>

            <p className="text-xs text-slate-500">
              Ask questions, understand difficult concepts, or create a revision
              schedule based on this workspace's subject.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleAskAi();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              placeholder={`Ask anything about ${workspace.subject}...`}
              value={aiQuestion}
              onChange={(e) => setAiQuestion(e.target.value)}
              className="flex-1 min-w-0 px-4 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
            />

            <button
              type="submit"
              disabled={aiLoading || !aiQuestion.trim()}
              className="px-4 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Reasoning...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Ask AI
                </>
              )}
            </button>
          </form>

          {aiAnswer && (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold text-indigo-700 uppercase tracking-wider">
                AI Academic Response
              </h4>

              <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                {aiAnswer}
              </div>
            </div>
          )}
        </div>
      )*/}

      </div>
  )}
