const API_BASE = '/api';
// Spring backend: auth, resource requests, AI (Gemini) quizzes.
// Express (this app's server) handles everything else.
const SPRING = import.meta.env.VITE_AUTH_API ?? 'http://localhost:8080/api';

// ---------------- token storage ----------------
export function getStoredToken(): string | null {
  return localStorage.getItem('sb_session_token');
}
export function setStoredToken(token: string) {
  localStorage.setItem('sb_session_token', token);
}
export function removeStoredToken() {
  localStorage.removeItem('sb_session_token');
  localStorage.removeItem('sb_session_refresh');
}
const getRefreshToken = () => localStorage.getItem('sb_session_refresh');
const setRefreshToken = (t: string) => localStorage.setItem('sb_session_refresh', t);

// Auth endpoints must never get a (possibly expired) Bearer token and are never retried via refresh.
const AUTH_ENDPOINT_RE =
  /\/auth\/(login|register|verify-email|verify-admin-otp|resend-verification|forgot-password|verify-reset-otp|reset-password|refresh-token|admin\/request-codes|admin\/verify)/;


// ---------------- refresh ----------------
// one in-flight refresh at a time; resolves true if a new access token was stored
let refreshing: Promise<boolean> | null = null;
async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  if (!refreshing) {
    refreshing = fetch(`${SPRING}/auth/refresh-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
      .then(async r => {
        if (!r.ok) {
          // refresh token itself is invalid/expired -> really log out.
          if (r.status === 401 || r.status === 403) removeStoredToken();
          return false;
        }
        const d = await r.json();

        if (!r.ok || d.error || d.message) {
          if (r.status === 401 || r.status === 403) {
            removeStoredToken();
          }
          return false;
        }

        const newAccessToken = d.accessToken ?? d.token;

        if (!newAccessToken || typeof newAccessToken !== 'string') {
          return false;
        }

        setStoredToken(newAccessToken);

        if (d.refreshToken && typeof d.refreshToken === 'string') {
          setRefreshToken(d.refreshToken);
        }

        return true;
      })
      .catch(() => false) // network error: keep tokens, do NOT log the user out
      .finally(() => { refreshing = null; });
  }
  return refreshing;
}

// ---------------- core request ----------------
const DEFAULT_TIMEOUT_MS = 30_000;
const AI_TIMEOUT_MS = 120_000; // AI generation can be slow

async function request<T = any>(
  endpoint: string,
  options: RequestInit & { timeoutMs?: number } = {},
  retried = false
): Promise<T> {
  const { timeoutMs, ...fetchOptions } = options;
  const isAuthEndpoint = AUTH_ENDPOINT_RE.test(endpoint);
  const token = getStoredToken();
  const headers = new Headers(fetchOptions.headers || {});

  if (!headers.has('Content-Type') && !(fetchOptions.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !isAuthEndpoint) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `${SPRING}${endpoint}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    console.log(`[API] ${fetchOptions.method ?? 'GET'} ${url}`);

    const response = await fetch(url, { ...fetchOptions, headers, signal: controller.signal });

    // Parse safely: HTML (e.g. SPA fallback) must not silently become {}
    const text = await response.text();
    let data: any = {};
    let isJson = true;
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      isJson = false;
    }

    // Expired / invalid token -> refresh once and retry (backend may answer 401 or 403)
    if ((response.status === 401 || response.status === 403) && !retried && token && !isAuthEndpoint) {
      if (await tryRefresh()) {
        return request<T>(endpoint, options, true);
      }
    }

    if (!response.ok) {
      const err: any = new Error(
        (isJson && (data.message || data.error)) || `Request failed with status ${response.status}`
      );
      err.status = response.status;
      err.data = data;
      throw err;
    }

    if (!isJson) {
      const err: any = new Error(`Expected JSON from ${url} but got: ${text.slice(0, 80)}`);
      err.status = response.status;
      throw err;
    }

    return data as T;
  } catch (err: any) {
    if (err.name === 'AbortError') {
      const e: any = new Error('The server took too long to respond. Please try again.');
      e.status = 408;
      e.data = { error: 'Timeout' };
      throw e;
    }
    if (err.name === 'TypeError') {
      const e: any = new Error('Server connection unavailable. Please retry in a moment.');
      e.status = 503;
      e.data = { error: 'NetworkError' };
      throw e;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// ---------------- auth helpers ----------------
// Spring returns { accessToken, refreshToken, userId, name, email, role }; the app works with { token, refreshToken, user }.
const toSession = (r: any) => {
  if (r.refreshToken) setRefreshToken(r.refreshToken);
  return {
    token: (r.accessToken ?? r.token) as string,
    refreshToken: r.refreshToken as string | undefined,
    user: {
      id: String(r.userId), fullName: r.name, email: r.email, role: r.role,
      college: 'Not set', branch: '', semester: 1, avatarUrl: '', points: 0, badges: [],
    },
  };
};

const loginRequest = (email: string, password: string) =>
  request<any>(`${SPRING}/auth/login`, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  }).then(toSession);

const qs = (params?: Record<string, string>) =>
  params ? `?${new URLSearchParams(params).toString()}` : '';

// ---------------- API ----------------
export const api = {

  // ===== Student Dashboard (Spring Boot) =====
  getStudentDashboard: () =>
    request<any>('/student/dashboard'),

  // ===== Auth (Spring) =====
  login: loginRequest,

  register: (fullName: string, email: string, password: string) =>
    request<{ message: string; email: string; expiresInMinutes: number; devOtp?: string }>(`${SPRING}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({ name: fullName, email, password, role: 'STUDENT' }),
    }),

  verifyEmail: async (email: string, otp: string, password: string) => {
    await request(`${SPRING}/auth/verify-email?email=${encodeURIComponent(email)}&otp=${encodeURIComponent(otp)}`, { method: 'POST' });
    return loginRequest(email, password);
  },

  resendVerification: (email: string) =>
    request<{ message?: string; devOtp?: string }>(`${SPRING}/auth/resend-verification?email=${encodeURIComponent(email)}`, {
      method: 'POST',
    }),

  forgotPassword: (email: string) =>
    request<{ message: string; devOtp?: string }>(`${SPRING}/auth/forgot-password`, {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  verifyResetOtp: (email: string, otp: string) =>
    request<{ message: string; resetToken: string }>(`${SPRING}/auth/verify-reset-otp`, {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    }),

  resetPassword: (resetToken: string, newPassword: string) =>
    request<{ message: string }>(`${SPRING}/auth/reset-password`, {
      method: 'POST',
      body: JSON.stringify({ resetToken, newPassword }),
    }),


  // ===== Admin registration (Spring Boot) =====

  // ===== Admin registration (Spring Boot) =====

  requestAdminCodes: (
    fullName: string,
    email: string,
    password: string
  ) =>
    request<{
      message: string;
      email: string;
      expiresInMinutes: number;
    }>(`${SPRING}/auth/register`, {
      method: 'POST',
      body: JSON.stringify({
        name: fullName,
        email,
        password,
        role: 'ADMIN',
      }),
    }),

  // OTP sent to the email entered during registration.
  // This verifies the email but does not create the Admin account yet.
  verifyAdminEmailCode: (
    email: string,
    emailCode: string
  ) =>
    request<{ message: string }>(
      `${SPRING}/auth/verify-email?${new URLSearchParams({
        email,
        otp: emailCode,
      }).toString()}`,
      { method: 'POST' }
    ),

  // OTP sent to the developer verification email.
  // The backend creates the Admin only after both OTPs are valid.
  verifyAdminCode: (
    email: string,
    adminCode: string
  ) =>
    request<{ message: string }>(
      `${SPRING}/auth/verify-admin-otp`,
      {
        method: 'POST',
        body: JSON.stringify({
          email,
          otp: adminCode,
        }),
      }
    ),

  // Combined flow for screens that submit both OTPs together.
  // Do not call this if the screen has already verified the email OTP.
  verifyAdminRegistration: async (
    email: string,
    emailCode: string,
    developerCode: string
  ): Promise<{ message: string }> => {
    await api.verifyAdminEmailCode(email, emailCode);

    return api.verifyAdminCode(email, developerCode);
  },

  getMe: () => request<any>('/auth/me'),

  updateProfile: (profile: any) =>
    request<any>('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profile),
    }),

  // ===== Resources (Spring Boot) =====

  getResources: (params?: Record<string, string>) => {
    const { sort, sortBy, keyword, ...filters } = params ?? {};

    const requestedSort = sortBy ?? sort ?? 'recent';

    const sortMapping: Record<string, string> = {
      recent: 'recent',
      popular: 'downloads',
      rating: 'rating',
      helpful: 'recent',
    };

    const queryParams: Record<string, string> = {
      ...filters,
      sortBy: sortMapping[requestedSort] ?? requestedSort,
    };

    // Keyword search is not currently supported by the backend service.
    delete queryParams.keyword;

    return request<any>(`/resources/library${qs(queryParams)}`);
  },

  uploadResource: (resourceData: FormData) =>
    request<any>('/resources', {
      method: 'POST',
      body: resourceData,
    }),


  downloadResource: async (id: string): Promise<Blob> => {
    const downloadUrl = `${SPRING}/resources/${id}/file`;

    const fetchFile = () =>
      fetch(downloadUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${getStoredToken()}`,
        },
      });

    let response = await fetchFile();

    if (
      (response.status === 401 || response.status === 403) &&
      getRefreshToken()
    ) {
      const refreshed = await tryRefresh();

      if (refreshed) {
        response = await fetchFile();
      }
    }

    if (!response.ok) {
      const message = await response.text();
      throw Object.assign(
        new Error(message || `Download failed: ${response.status}`),
        { status: response.status }
      );
    }

    return response.blob();
  },

  getWorkspaceResources: (
    workspaceId: string | number,
    page = 0,
    size = 20
  ) =>
    request<any>(
      `${SPRING}/resources/workspaces/${encodeURIComponent(String(workspaceId))}/resources?page=${page}&size=${size}`
    ),

  shareResourceWithWorkspace: (
    workspaceId: string | number,
    resourceId: string | number
  ) =>
    request<any>(
      `${SPRING}/resources/workspaces/${encodeURIComponent(String(workspaceId))}/resources/${encodeURIComponent(String(resourceId))}`,
      { method: 'POST' }
    ),

  previewWorkspaceResource: async (
    workspaceId: string | number,
    resourceId: string | number
  ): Promise<Blob> => {
    const url =
      `${SPRING}/resources/workspaces/${encodeURIComponent(String(workspaceId))}` +
      `/resources/${encodeURIComponent(String(resourceId))}/preview`;

    const fetchFile = () =>
      fetch(url, {
        method: 'GET',
        headers: {
          ...(getStoredToken()
            ? { Authorization: `Bearer ${getStoredToken()}` }
            : {}),
        },
      });

    let response = await fetchFile();

    if (
      (response.status === 401 || response.status === 403) &&
      getRefreshToken()
    ) {
      if (await tryRefresh()) {
        response = await fetchFile();
      }
    }

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || `PDF preview failed: ${response.status}`);
    }

    return response.blob();
  },

  // The backend does not currently expose a helpful-vote endpoint.
  // Remove its usage from ResourceHub.tsx before testing this feature.


  // ===== Workspace Resource Share Posts (Spring Boot) =====

  getWorkspaceResourceShares: (
    workspaceId: string | number,
    page = 0,
    size = 10
  ) =>
    request<any>(
      `${SPRING}/workspaces/${encodeURIComponent(String(workspaceId))}/resource-shares?page=${page}&size=${size}`
    ),

  createWorkspaceResourceShare: (
    workspaceId: string | number,
    title: string,
    description: string,
    files: File[]
  ) => {
    const formData = new FormData();

    formData.append('title', title.trim());

    if (description.trim()) {
      formData.append('description', description.trim());
    }

    files.forEach(file => {
      formData.append('files', file);
    });

    return request<any>(
      `${SPRING}/workspaces/${encodeURIComponent(String(workspaceId))}/resource-shares`,
      {
        method: 'POST',
        body: formData,
      }
    );
  },


  previewWorkspaceResourceShareFile: async (
    workspaceId: string | number,
    shareId: string | number,
    fileId: string | number
  ): Promise<Blob> => {
    const url =
      `${SPRING}/workspaces/${encodeURIComponent(String(workspaceId))}` +
      `/resource-shares/${encodeURIComponent(String(shareId))}` +
      `/files/${encodeURIComponent(String(fileId))}/preview`;

    const fetchFile = () =>
      fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/pdf, application/octet-stream',
          ...(getStoredToken()
            ? { Authorization: `Bearer ${getStoredToken()}` }
            : {}),
        },
      });

    let response = await fetchFile();

    if (
      (response.status === 401 || response.status === 403) &&
      getRefreshToken()
    ) {
      if (await tryRefresh()) {
        response = await fetchFile();
      }
    }

    if (!response.ok) {
      const responseText = await response.text();
      let message = responseText;

      try {
        const errorData = JSON.parse(responseText);
        message =
          errorData.message ??
          errorData.error ??
          responseText;
      } catch {
        // Response is plain text; keep the original message.
      }

      throw Object.assign(
        new Error(
          message || `PDF preview failed: ${response.status}`
        ),
        { status: response.status }
      );
    }

    const blob = await response.blob();

    if (blob.size === 0) {
      throw new Error('The server returned an empty PDF.');
    }

    const contentType = (
      response.headers.get('content-type') ||
      blob.type ||
      ''
    )
      .split(';')[0]
      .trim()
      .toLowerCase();

    if (
      contentType &&
      contentType !== 'application/pdf' &&
      contentType !== 'application/octet-stream'
    ) {
      throw new Error(
        `Expected PDF, but server returned ${contentType}.`
      );
    }

    return new Blob([blob], { type: 'application/pdf' });
  },


  toggleHelpfulVote: (id: string) =>
    Promise.reject(
      new Error('Helpful voting is not supported by the current backend.')
    ),

  toggleBookmarkResource: (id: string) =>
    request<boolean>(`/resources/${id}/bookmark`, {
      method: 'POST',
    }),

  rateResource: (id: string, rating: number) =>
    request<void>(`/resources/${id}/rating`, {
      method: 'POST',
      body: JSON.stringify({ rating }),
    }),

  reportResource: (
    id: string,
    payload: { category: string; explanation?: string }
  ) =>
    request<void>(`/resources/${id}/report`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),


  // ===== Resource Requests (Spring) =====
  getResourceRequests: () => request<any>(`${SPRING}/requests/open?page=0&size=100`),

  createResourceRequest: (reqData: { title: string; subject: string; unit: string; detail: string }) =>
    request<any>(`${SPRING}/requests`, { method: 'POST', body: JSON.stringify(reqData) }),

  fulfillResourceRequest: (requestId: string, fulfillmentDetail: string, answerOrResource?: string) =>
    request<any>(`${SPRING}/requests/${requestId}/fulfill`, {
      method: 'POST',
      body: JSON.stringify({ fulfillmentDetail, answerOrResource }),
    }),

  closeResourceRequest: (requestId: string) =>
    request<any>(`${SPRING}/requests/${requestId}/cancel`, { method: 'PATCH' }),

  // ===== Workspaces (Express) =====
  getWorkspaces: () => request<{ userWorkspaces: any[]; exploreWorkspaces: any[] }>('/workspaces'),

  createWorkspace: (wsData: any) =>
    request<any>('/workspaces', { method: 'POST', body: JSON.stringify(wsData) }),

  getWorkspaceById: (id: string) => request<any>(`/workspaces/${id}`),

  joinWorkspace: (payload: { joinCode?: string; workspaceId?: number }) =>
    request<any>('/workspaces/join', { method: 'POST', body: JSON.stringify(payload) }),

  addWorkspaceTask: (
    workspaceId: string | number,
    task: {
      title: string;
      assigneeName?: string;
    }
  ) =>
    request<any>(`/workspaces/${workspaceId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(task),
    }),

  toggleWorkspaceTask: (
    workspaceId: string | number,
    taskId: string | number
  ) =>
    request<any>(
      `/workspaces/${workspaceId}/tasks/${taskId}/toggle`,
      {
        method: 'PATCH',
      }
    ),


  sendWorkspaceMessage: (workspaceId: string, content: string) =>
    request<any>(`/workspaces/${workspaceId}/discussion`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),


  addMindMapNode: (workspaceId: string, node: any) =>
    request<any>(`/workspaces/${workspaceId}/mindmap`, { method: 'POST', body: JSON.stringify(node) }),

  // ===== AI Quizzes (Spring) =====
  getQuizzes: () => request<any[]>(`${SPRING}/gemini-quizzes/history`),

  getQuizById: (id: string) => request<any>(`${SPRING}/gemini-quizzes/${id}/questions`),

  generateAiQuiz: (data: { subject: string; topic: string; difficulty: string; questionCount: number }) =>
    request<any>(`${SPRING}/gemini-quizzes/generate`, {
      method: 'POST',
      body: JSON.stringify(data),
      timeoutMs: AI_TIMEOUT_MS,
    }),

  submitQuiz: (id: string, answers: Record<string, string>) =>
    request<any>(`${SPRING}/gemini-quizzes/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(answers),
    }),

  getMyQuizAttempts: () => request<any[]>(`${SPRING}/gemini-quizzes/history`),

  // ===== AI Flashcards (Express) =====
  // ===== Spring Boot Flashcards =====

  getFlashcards: () =>
    request<any[]>('/decks'),

  getFlashcardDeck: (deckId: number | string) =>
    request<any>(`/decks/${deckId}`),

  generateAiFlashcards: (data: {
    subject: string;
    syllabus: string;
    numberOfFlashcards: string;
  }) =>
    request<any>('/decks', {
      method: 'POST',
      body: JSON.stringify(data),
      timeoutMs: AI_TIMEOUT_MS,
    }),

  updateFlashcardMastery: (
    cardId: number | string,
    status: 'MASTERED' | 'NEED_REVIEW'
  ) =>
    request<any>(`/decks/cards/${cardId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),


  // ===== AI Study Assistant (Spring Boot) =====

  getStudyAssistantConversations: () =>
    request<any[]>(`${SPRING}/study-assistant/conversations`),

  askAiAssistant: (data: {
    question: string;
    subject: string;
    workspaceContext: string;
  }) =>
    request<any>(`${SPRING}/study-assistant`, {
      method: 'POST',
      body: JSON.stringify(data),
      timeoutMs: AI_TIMEOUT_MS,
    }),

  createStudyAssistantConversation: () =>
    request<any>(`${SPRING}/study-assistant/conversations`, {
      method: 'POST',
      body: JSON.stringify({}),
    }),

  getStudyAssistantMessages: (conversationId: number | string) =>
    request<any[]>(
      `${SPRING}/study-assistant/conversations/${conversationId}/messages`
    ),

  sendStudyAssistantMessage: (
    conversationId: number | string,
    message: string
  ) =>
    request<any>(
      `${SPRING}/study-assistant/conversations/${conversationId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ message }),
        timeoutMs: AI_TIMEOUT_MS,
      }
    ),

  // ===== Doubt Discussions (Express) =====
  getDiscussions: (params?: Record<string, string>) => request<any[]>(`/discussions${qs(params)}`),

  createDiscussion: (data: { title: string; content: string; subject: string }) =>
    request<any>('/discussions', { method: 'POST', body: JSON.stringify(data) }),

  replyToDiscussion: (id: string, content: string) =>
    request<any>(`/discussions/${id}/answers`, { method: 'POST', body: JSON.stringify({ content }) }),

  voteDiscussion: (id: string) => request<any>(`/discussions/${id}/vote`, { method: 'POST' }),

  acceptDiscussionAnswer: (discussionId: string, answerId: string) =>
    request<any>(`/discussions/${discussionId}/answers/${answerId}/accept`, { method: 'POST' }),

  reportDiscussion: (id: string) => request<any>(`/discussions/${id}/report`, { method: 'POST' }),

  // ===== Projects (Express) =====
  getProjects: () => request<any[]>('/projects'),

  createProject: (data: any) =>
    request<any>('/projects', { method: 'POST', body: JSON.stringify(data) }),

  requestJoinProject: (id: string, message: string) =>
    request<any>(`/projects/${id}/join-request`, { method: 'POST', body: JSON.stringify({ message }) }),

  manageProjectRequest: (
    id: string,
    payload: { targetUserId: string; action: 'ACCEPT' | 'REJECT'; memberRole?: string }
  ) =>
    request<any>(`/projects/${id}/manage-request`, { method: 'POST', body: JSON.stringify(payload) }),

  addProjectTask: (id: string, task: { title: string; assigneeName?: string }) =>
    request<any>(`/projects/${id}/tasks`, { method: 'POST', body: JSON.stringify(task) }),

  updateProjectTask: (id: string, taskId: string, status: string) =>
    request<any>(`/projects/${id}/tasks/${taskId}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // ===== Skills (Express) =====
  getSkillProfile: () => request<any>('/skills/my-profile'),

  // ===== Opportunities (Spring Boot) =====

  getOpportunities: async (params?: Record<string, string>) => {
    const query = new URLSearchParams(params ?? {});

    // Spring returns a paginated Page response.
    const response = await request<any>(
      `${SPRING}/opportunities${query.toString() ? `?${query.toString()}` : ''}`
    );

    return Array.isArray(response) ? response : response.content ?? [];
  },

  getSavedOpportunities: async (params?: Record<string, string>) => {
    const query = new URLSearchParams(params ?? {});

    const response = await request<any>(
      `${SPRING}/opportunities/saved${query.toString() ? `?${query.toString()}` : ''}`
    );

    return Array.isArray(response) ? response : response.content ?? [];
  },

  toggleOpportunityBookmark: async (id: string, currentlySaved: boolean) => {
    await request<void>(`${SPRING}/opportunities/${id}/save`, {
      method: currentlySaved ? 'DELETE' : 'POST',
    });

    return { bookmarked: !currentlySaved };
  },


  // ===== StudyBuddy Spring Boot Leaderboard =====

  getSpringLeaderboard: (params?: {
    categoryId?: number;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }) => {
    const query = new URLSearchParams();

    if (params?.categoryId != null) query.set('categoryId', String(params.categoryId));
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);

    query.set('page', String(params?.page ?? 0));
    query.set('size', String(params?.size ?? 20));

    return request<any>(
      `${SPRING}/leaderboard?${query.toString()}`
    );
  },

  getMySpringLeaderboardRank: (params?: {
    categoryId?: number;
    startDate?: string;
    endDate?: string;
  }) => {
    const query = new URLSearchParams();

    if (params?.categoryId != null) query.set('categoryId', String(params.categoryId));
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);

    const suffix = query.toString() ? `?${query.toString()}` : '';

    return request<any>(
      `${SPRING}/leaderboard/my-rank${suffix}`
    );
  },

  // ===== Notifications (Express) =====
  getNotifications: () => request<{ notifications: any[]; unreadCount: number }>('/notifications'),
  markNotificationRead: (id: string) => request<any>(`/notifications/${id}/read`, { method: 'PUT' }),
  markAllNotificationsRead: () => request<any>('/notifications/read-all', { method: 'PUT' }),

  // ===== Admin (Express) =====
  getAdminStats: () => request<any>('/admin/stats'),
  toggleUserDisabled: (id: string) => request<any>(`/admin/users/${id}/toggle-disabled`, { method: 'PUT' }),
  deleteAdminResource: (id: string) => request<any>(`/admin/resources/${id}`, { method: 'DELETE' }),
  deleteAdminDiscussion: (id: string) => request<any>(`/admin/discussions/${id}`, { method: 'DELETE' }),
};