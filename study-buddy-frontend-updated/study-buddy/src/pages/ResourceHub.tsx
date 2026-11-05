import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, getStoredToken } from '../services/api';
import { AcademicResource } from '../types';
import { Modal } from '../components/common/Modal';
import { EmptyState } from '../components/common/EmptyState';
import { SubjectGraph } from '../components/common/SubjectGraph';
import { BRANCHES, SEMESTERS, subjectsFor, branchShort } from '../data/curriculum';
import {
  Search,
  SlidersHorizontal,
  X,
  ChevronRight,
  ArrowLeft,
  Upload,
  Download,
  Bookmark,
  Star,
  Flag,
  FileText,
  AlertTriangle,
  Eye,
} from 'lucide-react';



const SPRING_API_BASE = (import.meta.env.VITE_AUTH_API ?? 'http://localhost:8080/api').replace(/\/$/, '');

const mapResource = (dto: any, currentUserId = ''): AcademicResource => {
  const rawFileSize = Number(dto.fileSize ?? dto.fileSizeBytes ?? 0);
  const fileSizeBytes = Number.isFinite(rawFileSize) ? rawFileSize : 0;

  return {
    id: String(dto.id ?? ''),
    title: dto.title ?? '',
    description: dto.description ?? '',
    branch: dto.branch ?? '',
    semester: Number(dto.semester) || 0,
    subject: dto.subject ?? '',
    unit: dto.chapterUnit ?? dto.unit ?? dto.chapter ?? 'All Units',
    topic: dto.topic ?? '',

    resourceType: dto.resourceType ?? 'PDF',

    fileUrl: '', // Downloads use the authenticated /file endpoint.

    fileName: dto.originalFilename ?? dto.fileName ?? dto.filename ?? 'resource.pdf',
    fileSize: fileSizeBytes > 0
      ? `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
      : 'Unknown size',

    fileHash: dto.fileHash ?? '',
    uploaderId: String(dto.uploaderId ?? ''),
    uploaderName: dto.uploaderName ?? 'Unknown',
    uploadDate: dto.uploadDate ?? dto.createdAt ?? '',

    rating: Number(dto.averageRating ?? dto.rating ?? 0),
    ratingCount: Number(dto.ratingCount ?? 0),
    downloadCount: Number(dto.downloadCount ?? 0),

    helpfulVotes: Number(dto.helpfulVotes ?? 0),
    reportsCount: Number(dto.reportsCount ?? 0),
    isReported: Boolean(dto.isReported),

    bookmarkedBy: dto.bookmarked && currentUserId ? [currentUserId] : [],
    votedHelpfulBy: [],
  };
};


interface ResourceHubProps {
  initialSubject?: string;
  initialSemester?: string;
  initialBranch?: string;
  initialUnit?: string;
  openUpload?: boolean;
  onOpenUnit?: (subject: string, semester: string, unit: string, branch: string) => void;
}

export const ResourceHub: React.FC<ResourceHubProps> = ({ initialSubject = '', initialSemester = '', initialBranch = '', initialUnit = '', openUpload = false, onOpenUnit }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & Search
  const [keyword, setKeyword] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(initialSubject);
  const [selectedSemester, setSelectedSemester] = useState(initialSemester);
  const [selectedBranch, setSelectedBranch] = useState(initialBranch);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [selectedUnit, setSelectedUnit] = useState(initialUnit);
  const [flatLimit, setFlatLimit] = useState(40);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const visibleResources = resources.filter(resource => {
    const matchesUnit = !selectedUnit || resource.unit === selectedUnit || resource.unit === 'All Units';
    const searchableText = [
      resource.title, resource.subject, resource.unit, resource.topic,
      resource.description, resource.uploaderName, resource.resourceType,
    ].filter(Boolean).join(' ').toLowerCase();
    const matchesKeyword = !keyword.trim() || searchableText.includes(keyword.trim().toLowerCase());
    return matchesUnit && matchesKeyword;
  });
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'rating'>('recent');

  // Modals
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(openUpload);
  const [previewResource, setPreviewResource] = useState<AcademicResource | null>(null);
  const [ratingModalResource, setRatingModalResource] = useState<AcademicResource | null>(null);
  const [userRatingScore, setUserRatingScore] = useState(5);

  // Duplicate Detection Conflict Modal
  const [duplicateConflict, setDuplicateConflict] = useState<{
    message: string;
    existingResource: AcademicResource;
  } | null>(null);

  // Upload Form State

  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    branch: initialBranch || 'Computer Science & Engineering',
    semester: initialSemester || '6',
    subject: initialSubject || 'Database Management Systems',
    unit: initialUnit || 'Unit 4',
    topic: '',
    resourceType: 'Notes' as AcademicResource['resourceType'],
    fileName: '',
    fileSize: '',
    fileContentBase64: '',
    file: null as File | null,
  });


  const [customSubject, setCustomSubject] = useState('');
  const OTHER = '__other__';
  const uploadSubjects = subjectsFor(uploadForm.branch, uploadForm.semester);

  const openUploadModal = (prefill?: { subject?: string }) => {
    const branch = selectedBranch || uploadForm.branch;
    const semester = selectedSemester || uploadForm.semester;
    const subjects = subjectsFor(branch, semester);
    setUploadForm(prev => ({
      ...prev,
      branch,
      semester,
      subject: prefill?.subject || (subjects.includes(prev.subject) ? prev.subject : subjects[0] || OTHER),
    }));
    setIsUploadModalOpen(true);
  };

  const changeUploadBranchOrSemester = (patch: { branch?: string; semester?: string }) => {
    const branch = patch.branch ?? uploadForm.branch;
    const semester = patch.semester ?? uploadForm.semester;
    const subjects = subjectsFor(branch, semester);
    setUploadForm({ ...uploadForm, ...patch, subject: subjects[0] || OTHER });
  };

  const loadResources = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedSubject) params.subject = selectedSubject;
      if (selectedSemester) params.semester = selectedSemester;
      if (selectedBranch) params.branch = selectedBranch;
      if (selectedType) params.resourceType = selectedType;
      if (sortBy) params.sort = sortBy;

      const data = await api.getResources(params);
      const items = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
          ? data.content
          : [];

      setResources(
  items.map((dto: any) =>
    mapResource(dto, user?.id != null ? String(user.id) : '')
  )
);
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error loading resources', message: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBookmarkedIds = async () => {
    const token = getStoredToken();
    if (!token) {
      setBookmarkedIds(new Set());
      return;
    }

    try {
      const response = await fetch(`${SPRING_API_BASE}/resources/bookmarks?page=0&size=100`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return;

      const payload = await response.json();
      const items = Array.isArray(payload) ? payload : Array.isArray(payload?.content) ? payload.content : [];
      setBookmarkedIds(new Set(items.map((item: any) => String(item.id))));
    } catch {
      // Bookmark state is non-critical; resource loading should continue if this request fails.
    }
  };

  useEffect(() => {
    void loadResources();
  }, [selectedSubject, selectedSemester, selectedBranch, selectedType, sortBy]);

  useEffect(() => {
    void loadBookmarkedIds();
  }, [user?.id]);

  useEffect(() => { setFlatLimit(40); }, [keyword, selectedSubject, selectedSemester, selectedBranch, selectedType, sortBy]);

  // Handle local file selection

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Only PDF files are supported by the backend
    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      addToast({
        type: 'error',
        title: 'Invalid file type',
        message: 'Please select a PDF file.',
      });
      e.target.value = '';
      return;
    }

    // Validate size (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      addToast({
        type: 'error',
        title: 'File too large',
        message: 'Maximum file size allowed is 25MB.',
      });
      e.target.value = '';
      return;
    }

    setUploadForm(prev => ({
      ...prev,
      file,
      fileName: file.name,
      fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      fileContentBase64: '',
    }));
  };


  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadForm.title.trim() || !uploadForm.file) {
      addToast({
        type: 'error',
        title: 'Missing Information',
        message: 'Please enter a resource title and select a PDF file.',
      });
      return;
    }


    const finalSubject = uploadForm.subject === OTHER ? customSubject.trim() : uploadForm.subject;
    if (!finalSubject) {
      addToast({ type: 'error', title: 'Missing subject', message: 'Please choose or type the subject name.' });
      return;
    }

    try {
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('branch', uploadForm.branch);
      formData.append('semester', uploadForm.semester);
      formData.append('subject', finalSubject);
      formData.append('chapterUnit', uploadForm.unit);
      formData.append('resourceType', uploadForm.resourceType);

      if (!uploadForm.file) {
        throw new Error('Please select a PDF file.');
      }

      formData.append('file', uploadForm.file);

      const newRes = await api.uploadResource(formData);


      addToast({
        type: 'success',
        title: 'Resource Submitted!',
        message: `"${uploadForm.title}" was submitted for review and will appear in the library after approval.`,
      });


      setIsUploadModalOpen(false);

      setUploadForm({
        title: '',
        description: '',
        branch: 'Computer Science & Engineering',
        semester: '6',
        subject: 'Database Management Systems',
        unit: 'Unit 4',
        topic: '',
        resourceType: 'Notes',
        fileName: '',
        fileSize: '',
        fileContentBase64: '',
        file: null,
      });

      setCustomSubject('');
      await loadResources();

    } catch (err: any) {
      if (err.data?.error === 'EXACT_DUPLICATE_DETECTED') {
        setDuplicateConflict({
          message: err.data.message,
          existingResource: err.data.existingResource,
        });
      } else {
        addToast({
          type: 'error',
          title: 'Upload Failed',
          message: err.message || 'Could not upload resource.',
        });
      }
    }
  }; // <-- handleUploadSubmit properly closed here!

  // MOVE THESE OUTSIDE handleUploadSubmit:
  const handleDownload = async (resource: AcademicResource) => {
    try {
      const token = getStoredToken();
      if (!token) throw new Error('Please sign in again to download this resource.');

      const response = await fetch(
        `${SPRING_API_BASE}/resources/${encodeURIComponent(resource.id)}/file`,
        {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let message = `Download failed (${response.status}).`;
        try {
          const errorData = errorText ? JSON.parse(errorText) : {};
          message = errorData.message || errorData.error || message;
        } catch {
          if (errorText) message = errorText.slice(0, 180);
        }
        throw new Error(message);
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = resource.fileName || `${resource.title || 'study-resource'}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);

      addToast({
        type: 'success',
        title: 'Download Started',
        message: `Downloading ${resource.fileName || resource.title}.`,
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Download Error',
        message: err.message || 'Could not download this resource.',
      });
    }
  };


  const handleBookmark = async (resource: AcademicResource) => {
    try {
      const bookmarked = await api.toggleBookmarkResource(resource.id);
      const resourceId = String(resource.id);

      setBookmarkedIds(previous => {
        const next = new Set(previous);
        if (bookmarked) next.add(resourceId);
        else next.delete(resourceId);
        return next;
      });

      setResources(previous => previous.map(item => {
        if (String(item.id) !== resourceId) return item;
        const currentIds = item.bookmarkedBy ?? [];
        const userId = user?.id != null ? String(user.id) : '';
        return {
          ...item,
          bookmarkedBy: bookmarked
            ? Array.from(new Set([...currentIds, userId])).filter(Boolean)
            : currentIds.filter(id => id !== userId),
        };
      }));

      addToast({
        type: 'success',
        title: bookmarked ? 'Saved to Bookmarks' : 'Removed from Bookmarks',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Bookmark Error',
        message: err.message || 'Could not update bookmark.',
      });
    }
  };


  const handleRateSubmit = async () => {
    if (!ratingModalResource) return;

    try {
      await api.rateResource(ratingModalResource.id, userRatingScore);

      setRatingModalResource(null);
      await loadResources();

      addToast({
        type: 'success',
        title: 'Rating Submitted',
        message: `Rated ${userRatingScore} stars.`,
      });
    } catch (err: any) {
      addToast({ type: 'error', title: 'Rating Error', message: err.message });
    }
  };



  const handleReport = async (resource: AcademicResource) => {
    const category = window.prompt(
      'Report reason:\n' +
      '1. INCORRECT_CONTENT\n' +
      '2. MISLEADING_OR_FALSE\n' +
      '3. IRRELEVANT\n' +
      '4. INAPPROPRIATE_MATERIAL\n' +
      '5. DUPLICATE\n' +
      '6. COPYRIGHT_OR_OTHER\n\n' +
      'Enter the reason exactly as shown:'
    );

    if (!category) return;

    const validCategories = [
      'INCORRECT_CONTENT',
      'MISLEADING_OR_FALSE',
      'IRRELEVANT',
      'INAPPROPRIATE_MATERIAL',
      'DUPLICATE',
      'COPYRIGHT_OR_OTHER',
    ];

    const normalizedCategory = category.trim().toUpperCase();

    if (!validCategories.includes(normalizedCategory)) {
      addToast({
        type: 'error',
        title: 'Invalid report reason',
        message: 'Please enter one of the listed report categories.',
      });
      return;
    }

    const explanation =
      window.prompt('Optional: explain the issue (maximum 1000 characters).') ?? '';

    if (explanation.length > 1000) {
      addToast({
        type: 'error',
        title: 'Explanation too long',
        message: 'Please keep the explanation within 1000 characters.',
      });
      return;
    }

    try {
      await api.reportResource(resource.id, {
        category: normalizedCategory,
        explanation: explanation.trim(),
      });

      addToast({
        type: 'success',
        title: 'Resource Reported',
        message: 'Your report has been submitted.',
      });
    } catch (err: any) {
      addToast({
        type: 'error',
        title: 'Report Failed',
        message: err.message || 'Could not report this resource.',
      });
    }
  };


  const renderCard = (res: AcademicResource) => {
    const hasBookmarked = bookmarkedIds.has(String(res.id)) || (res.bookmarkedBy ?? []).includes(user?.id != null ? String(user.id) : '');

    return (
      <div
        key={res.id}
        className="bg-white rounded-xl border border-slate-200/80 p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
      >
        <div>
          {/* Top metadata unboxed (Zero-Pill discipline) */}
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-1.5 truncate">
              <span className="font-semibold text-indigo-700">{res.subject}</span>
              <span aria-hidden="true">·</span>
              <span>{res.resourceType}</span>
              <span aria-hidden="true">·</span>
              <span>{res.unit}</span>
            </div>
            <span className="text-[11px] text-slate-400 shrink-0">
              Sem {res.semester}
            </span>
          </div>

          <h3 className="text-sm font-bold text-slate-900 mt-2 leading-snug line-clamp-2">
            {res.title}
          </h3>
          <p className="text-xs text-slate-600 mt-1.5 line-clamp-2 leading-relaxed">
            {res.description}
          </p>

          <p className="mt-3 text-[11px] text-slate-400">{res.fileName} · {res.fileSize}</p>
        </div>

        {/* Footer Controls & Actions */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {/* Star Rating Button */}
            <button
              onClick={() => { setUserRatingScore(5); setRatingModalResource(res); }}
              className="flex items-center gap-1 hover:text-amber-600 transition-colors"
              title="Rate this resource"
            >
              <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span className="font-semibold text-slate-700 tabular-nums">{res.rating}</span>
              <span className="text-[10px] text-slate-400">({res.ratingCount})</span>
            </button>

            {/* Bookmark */}
            <button
              onClick={() => handleBookmark(res)}
              className={`hover:text-slate-900 transition-colors ${hasBookmarked ? 'text-indigo-600' : ''
                }`}
              title={hasBookmarked ? 'Bookmarked' : 'Bookmark'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${hasBookmarked ? 'fill-indigo-600' : ''}`} />
            </button>

            {/* Report */}
            <button
              onClick={() => handleReport(res)}
              className="hover:text-rose-600 transition-colors text-slate-400"
              title="Report to Moderator"
            >
              <Flag className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Primary Download / View Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPreviewResource(res)}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors inline-flex items-center gap-1"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>

            <button
              onClick={() => handleDownload(res)}
              className="px-3 py-1 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="tabular-nums">Get ({res.downloadCount})</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  const hasActiveFilters = Boolean(selectedBranch || selectedSemester || selectedSubject);
  // Flow: branch -> semester -> subject cards -> syllabus graph -> unit page (resources)
  const isSubjectView = Boolean(selectedSubject);
  const isSubjectListView = Boolean(selectedBranch && selectedSemester && !selectedSubject && !keyword.trim());
  const backToSubjects = () => { setSelectedSubject(''); setSelectedUnit(''); };
  const clearFilters = () => {
    setSelectedBranch('');
    setSelectedSemester('');
    setSelectedSubject('');
    setSelectedUnit('');
    setShowFilters(false);
  };

  // Subject cards for the chosen semester: the syllabus subjects first, then anything else students uploaded.
  const subjectCards = isSubjectListView
    ? (() => {
      const catalog = subjectsFor(selectedBranch, selectedSemester);
      const extra = Array.from(new Set(resources.map(r => r.subject))).filter(x => !catalog.includes(x));
      return [...catalog, ...extra].map(subject => {
        const items = resources.filter(r => r.subject === subject);
        const unitsCovered = new Set(items.map(r => r.unit).filter(u => u && u !== 'All Units')).size;
        return { subject, count: items.length, unitsCovered };
      });
    })()
    : [];

  return (
    <div className="space-y-6">
      {/* Top Header & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Academic Resource Hub
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified study materials, handwritten notes, lab manuals, and previous year solutions.
          </p>
        </div>

        <button
          onClick={() => openUploadModal()}
          className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-xs inline-flex items-center gap-2 self-start sm:self-auto"
        >
          <Upload className="w-4 h-4" />
          Upload Study Material
        </button>
      </div>

      {/* Search + Filters */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search resources by keyword, subject, unit, topic, or uploader..."
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            aria-expanded={showFilters}
            className={`px-4 py-2 text-xs font-semibold rounded-lg border inline-flex items-center justify-center gap-2 transition-colors ${showFilters || hasActiveFilters
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Active filter summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {selectedBranch && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-semibold">
                {branchShort(selectedBranch)}
              </span>
            )}
            {selectedSemester && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-semibold">
                Semester {selectedSemester}
              </span>
            )}
            {selectedSubject && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full font-semibold">
                {selectedSubject}
              </span>
            )}
            <button
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 font-semibold"
            >
              <X className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        )}

        {/* Filters section: branch -> semester */}
        {showFilters && (
          <div className="border-t border-slate-100 pt-3 space-y-3">
            {!selectedBranch ? (
              <div>
                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">1. Choose your branch</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BRANCHES.map(b => (
                    <button
                      key={b.name}
                      onClick={() => { setSelectedBranch(b.name); setSelectedSemester(''); setSelectedSubject(''); }}
                      className="px-3 py-2.5 text-left border border-slate-200 rounded-lg hover:border-indigo-400 hover:bg-indigo-50/50 transition-colors"
                    >
                      <span className="block text-sm font-bold text-slate-900">{b.short}</span>
                      <span className="block text-[10px] text-slate-500 leading-tight mt-0.5">{b.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    2. Choose your semester <span className="text-slate-400 normal-case font-medium">· {branchShort(selectedBranch)}</span>
                  </p>
                  <button
                    onClick={() => { setSelectedBranch(''); setSelectedSemester(''); }}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Change branch
                  </button>
                </div>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {SEMESTERS.map(n => (
                    <button
                      key={n}
                      onClick={() => { setSelectedSemester(String(n)); setSelectedSubject(''); setShowFilters(false); }}
                      className={`py-2 text-xs font-bold rounded-lg border transition-colors ${selectedSemester === String(n)
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50'
                        }`}
                    >
                      Sem {n}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Type + sort */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Resource Types</option>
            <option value="Notes">Handwritten Notes</option>
            <option value="PDF">Textbook PDF</option>
            <option value="PYQ">Previous Year Questions</option>
            <option value="Assignment">Assignment Solution</option>
            <option value="Lab Manual">Lab Manual</option>
            <option value="Question Bank">Question Bank</option>
            <option value="Presentation">Presentation</option>
          </select>

          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="recent">Sort by Most Recent</option>
            <option value="popular">Sort by Most Downloaded</option>
            <option value="rating">Sort by Highest Rated</option>
          </select>
        </div>
      </div>

      {/* STEP 3 -> 4: subject chosen -> syllabus graph; clicking a unit node opens that unit's resources */}
      {isSubjectView && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              onClick={backToSubjects}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:underline"
            >
              <ArrowLeft className="w-4 h-4" />
              {selectedBranch && selectedSemester
                ? `Back to Semester ${selectedSemester} subjects`
                : 'Back to all resources'}
            </button>
            <button
              onClick={() => openUploadModal({ subject: selectedSubject })}
              className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800"
            >
              + Upload to this subject
            </button>
          </div>

          {isLoading ? (
            <div className="h-80 bg-white rounded-xl border border-slate-200 animate-pulse" />
          ) : (
            <SubjectGraph
              subject={selectedSubject}
              semester={selectedSemester}
              resources={resources}
              selectedUnit={selectedUnit}
              onSelectUnit={u => u && onOpenUnit?.(selectedSubject, selectedSemester, u, selectedBranch)}
            />
          )}
          <p className="text-[11px] text-slate-500 text-center">
            Click a unit in the map to see all of its notes, PYQs, assignments and more.
          </p>
        </div>
      )}

      {/* STEP 2 -> 3: semester chosen -> list of that semester's subjects */}
      {!isSubjectView && isSubjectListView && (
        isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-28 bg-white rounded-xl border border-slate-200 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                {branchShort(selectedBranch)} · Semester {selectedSemester}
              </h2>
              <span className="text-xs text-slate-500">
                {subjectCards.length} subjects · pick one to open its syllabus map
              </span>
            </div>

            {subjectCards.length === 0 ? (
              <EmptyState
                title="No subjects listed for this semester yet"
                description="Upload the first notes or resource for this semester."
                actionText="Upload Resource"
                onAction={() => openUploadModal()}
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjectCards.map(({ subject, count, unitsCovered }) => (
                  <button
                    key={subject}
                    onClick={() => { setSelectedSubject(subject); setSelectedUnit(''); }}
                    className="group text-left bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:border-indigo-400 hover:shadow-sm transition-all flex flex-col justify-between min-h-[7rem]"
                  >
                    <h3 className="text-sm font-bold text-slate-900 leading-snug">{subject}</h3>
                    <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500">
                      <span>
                        {count === 0
                          ? 'No resources yet'
                          : `${count} resource${count === 1 ? '' : 's'} · ${unitsCovered}/5 units`}
                      </span>
                      <span className="inline-flex items-center gap-0.5 font-semibold text-indigo-600 group-hover:translate-x-0.5 transition-transform">
                        Open map <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      )}

      {/* Flat results: only for keyword searches or when no semester/subject is chosen */}
      {!isSubjectView && !isSubjectListView && (
        isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-44 bg-white rounded-xl border border-slate-200 animate-pulse p-5" />
            ))}
          </div>
        ) : visibleResources.length === 0 ? (
          <EmptyState
            title="No resources match your search"
            description="Try broadening your filters or be the first scholar to upload material for this syllabus unit."
            actionText="Upload Resource"
            onAction={() => openUploadModal()}
          />
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{visibleResources.slice(0, flatLimit).map(renderCard)}</div>
            {visibleResources.length > flatLimit && (
              <div className="text-center">
                <button
                  onClick={() => setFlatLimit(n => n + 40)}
                  className="px-4 py-2 text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-50"
                >
                  Show more ({visibleResources.length - flatLimit} remaining)
                </button>
                <p className="text-[11px] text-slate-400 mt-2">Tip: pick a branch and semester to browse by subject.</p>
              </div>
            )}
          </div>
        )
      )}

      {/* Upload Resource Modal */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Academic Resource"
        subtitle="Pick the branch, semester and subject so classmates can find it."
      >
        <form onSubmit={handleUploadSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Resource Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. DBMS Unit 4: ACID Transactions & 2PL Notes"
              value={uploadForm.title}
              onChange={e => setUploadForm({ ...uploadForm, title: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Subject *
              </label>
              <select
                value={uploadForm.subject}
                onChange={e => setUploadForm({ ...uploadForm, subject: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {uploadSubjects.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
                {uploadForm.subject !== OTHER && uploadForm.subject && !uploadSubjects.includes(uploadForm.subject) && (
                  <option value={uploadForm.subject}>{uploadForm.subject}</option>
                )}
                <option value={OTHER}>Other (type below)</option>
              </select>
              {uploadForm.subject === OTHER && (
                <input
                  type="text"
                  required
                  placeholder="Subject name"
                  value={customSubject}
                  onChange={e => setCustomSubject(e.target.value)}
                  className="mt-2 w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Resource Type *
              </label>
              <select
                value={uploadForm.resourceType}
                onChange={e => setUploadForm({ ...uploadForm, resourceType: e.target.value as any })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                <option value="Notes">Handwritten Notes</option>
                <option value="PDF">Reference Textbook PDF</option>
                <option value="PYQ">Previous Year Questions (PYQ)</option>
                <option value="Assignment">Assignment Solution</option>
                <option value="Lab Manual">Lab Manual</option>
                <option value="Question Bank">Question Bank</option>
                <option value="Presentation">Presentation Deck</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Syllabus Unit / Chapter
              </label>
              <input
                type="text"
                placeholder="e.g. Unit 3 or Unit 4"
                value={uploadForm.unit}
                onChange={e => setUploadForm({ ...uploadForm, unit: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Semester
              </label>
              <select
                value={uploadForm.semester}
                onChange={e => changeUploadBranchOrSemester({ semester: e.target.value })}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
              >
                {SEMESTERS.map(n => (
                  <option key={n} value={String(n)}>Semester {n}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Branch
            </label>
            <select
              value={uploadForm.branch}
              onChange={e => changeUploadBranchOrSemester({ branch: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
            >
              {BRANCHES.map(b => (
                <option key={b.name} value={b.name}>{b.short} — {b.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Description / Summary
            </label>
            <textarea
              rows={2}
              placeholder="Highlight key formulas, proofs, or syllabus scope included in this document..."
              value={uploadForm.description}
              onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
            />
          </div>

          {/* File Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select PDF File *
            </label>
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:bg-slate-50 transition-colors">
              <input
                type="file"
                id="file-upload"
                onChange={handleFileSelect}
                className="hidden"
                accept=".pdf,application/pdf"
              />
              <label htmlFor="file-upload" className="cursor-pointer block">
                <FileText className="w-8 h-8 text-indigo-500 mx-auto mb-1.5" />
                <span className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">
                  {uploadForm.fileName ? `Selected: ${uploadForm.fileName}` : 'Click to choose file'}
                </span>
                <p className="text-[11px] text-slate-400 mt-1">
                  PDF only · Maximum size 25MB. Duplicate files are checked by the server.
                </p>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsUploadModalOpen(false)}
              className="px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
            >
              Upload
            </button>
          </div>
        </form>
      </Modal>

      {/* Duplicate upload warning */}
      <Modal
        isOpen={Boolean(duplicateConflict)}
        onClose={() => setDuplicateConflict(null)}
        title="Exact Duplicate Resource Detected"
        subtitle="An identical file is already in the repository."
      >
        {duplicateConflict && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <p className="font-bold">Duplicate File Upload Prevented</p>
                <p className="mt-1">{duplicateConflict.message}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Existing Resource In Platform:
              </p>
              <h4 className="text-sm font-bold text-slate-900">
                {duplicateConflict.existingResource.title}
              </h4>
              <p className="text-xs text-slate-600 mt-1">
                {duplicateConflict.existingResource.description}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-200">
                <span>By: {duplicateConflict.existingResource.uploaderName}</span>
                <span>★ {duplicateConflict.existingResource.rating} ({duplicateConflict.existingResource.ratingCount} reviews)</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDuplicateConflict(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg"
              >
                Dismiss & Browse Existing
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Resource Detail & Preview Modal */}
      <Modal
        isOpen={Boolean(previewResource)}
        onClose={() => setPreviewResource(null)}
        title={previewResource?.title || 'Resource Details'}
        subtitle={previewResource ? `${previewResource.subject} · ${previewResource.unit}` : ''}
      >
        {previewResource && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Resource Type:</span>
                <span className="font-bold text-slate-800">{previewResource.resourceType}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Uploaded By:</span>
                <span className="font-bold text-slate-800">{previewResource.uploaderName}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">Upload Date:</span>
                <span className="font-medium text-slate-700">
                  {previewResource.uploadDate && !Number.isNaN(new Date(previewResource.uploadDate).getTime())
                    ? new Date(previewResource.uploadDate).toLocaleDateString()
                    : 'Not available'}
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Overview & Syllabus Alignment
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 border border-slate-200 rounded-lg">
                {previewResource.description}
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setPreviewResource(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => handleDownload(previewResource)}
                className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Download Document ({previewResource.fileSize})
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Star Rating Modal */}
      <Modal
        isOpen={Boolean(ratingModalResource)}
        onClose={() => setRatingModalResource(null)}
        title="Rate Academic Resource"
        subtitle={ratingModalResource?.title}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-center">
          <p className="text-xs text-slate-500">
            How useful was this study material for your preparation?
          </p>
          <div className="flex items-center justify-center gap-2 py-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setUserRatingScore(star)}
                className="p-1 text-slate-300 hover:text-amber-500 transition-colors focus:outline-none"
              >
                <Star
                  className={`w-8 h-8 ${star <= userRatingScore
                    ? 'text-amber-500 fill-amber-500'
                    : 'text-slate-300'
                    }`}
                />
              </button>
            ))}
          </div>
          <p className="text-sm font-bold text-slate-800 tabular-nums">
            {userRatingScore} / 5 Stars
          </p>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setRatingModalResource(null)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleRateSubmit}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
            >
              Submit Rating
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
