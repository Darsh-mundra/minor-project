export interface User {
  id: string;
  fullName: string;
  email: string;
  college: string;
  branch: string;
  semester: number;
  role: 'STUDENT' | 'ADMIN';
  avatarUrl: string;
  points: number;
  badges: string[];
}

export interface AcademicResource {
  id: string;
  title: string;
  description: string;
  branch: string;
  semester: number;
  subject: string;
  unit: string;
  topic: string;
  resourceType: 'Notes' | 'PDF' | 'PYQ' | 'Assignment' | 'Lab Manual' | 'Question Bank' | 'Presentation';
  fileUrl: string;
  fileName: string;
  fileSize: string;
  fileHash: string;
  uploaderId: string;
  uploaderName: string;
  uploadDate: string;
  rating: number;
  ratingCount: number;
  downloadCount: number;
  helpfulVotes: number;
  reportsCount: number;
  isReported: boolean;
  bookmarkedBy: string[];
  votedHelpfulBy: string[];
}

export interface ResourceRequest {
  id: string;
  title: string;
  description: string;
  subject: string;
  unit: string;
  requestedById: string;
  requestedByName: string;
  status: 'OPEN' | 'FULFILLED' | 'CLOSED';
  fulfilledResourceId?: string;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  description: string;
  subject: string;
  examDate: string;
  creatorId: string;
  creatorName: string;
  maxMembers: number;
  startDate: string;
  expiryDate: string;
  joinCode: string;
  coverImage: string;
  memberIds: string[];
  isArchived: boolean;
  isExpired?: boolean;
  tasks: Array<{
    id: string;
    title: string;
    assigneeName?: string;
    dueDate: string;
    completed: boolean;
  }>;
  discussions: Array<{
    id: string;
    authorId: string;
    authorName: string;
    content: string;
    createdAt: string;
  }>;
  mindMapNodes: Array<{
    id: string;
    label: string;
    parentId?: string;
    notes?: string;
  }>;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface Quiz {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  workspaceId?: string;
  creatorId: string;
  creatorName: string;
  questions: QuizQuestion[];
  createdAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  quizTitle: string;
  userId: string;
  userName: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  answers: { [questionId: string]: number };
  completedAt: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  subject: string;
  topic: string;
  workspaceId?: string;
  creatorId: string;
  isKnown?: boolean;
}

export interface DiscussionAnswer {
  id: string;
  discussionId: string;
  authorId: string;
  authorName: string;
  content: string;
  upvotes: number;
  upvotedBy: string[];
  isAccepted: boolean;
  createdAt: string;
}

export interface Discussion {
  id: string;
  title: string;
  content: string;
  subject: string;
  authorId: string;
  authorName: string;
  upvotes: number;
  upvotedBy: string[];
  answers: DiscussionAnswer[];
  isResolved: boolean;
  isReported: boolean;
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  assigneeName?: string;
}

export interface Project {
  id: string;
  projectName: string;
  description: string;
  requiredSkills: string[];
  projectType: 'Academic' | 'Hackathon' | 'Research' | 'Open Source';
  creatorId: string;
  creatorName: string;
  status: 'RECRUITING' | 'IN_PROGRESS' | 'COMPLETED';
  githubUrl: string;
  members: Array<{
    userId: string;
    fullName: string;
    role: string;
    joinedAt: string;
  }>;
  joinRequests: Array<{
    userId: string;
    fullName: string;
    message: string;
    appliedAt: string;
  }>;
  tasks: ProjectTask[];
  createdAt: string;
}

export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: 'Internship' | 'Hackathon' | 'Coding Competition' | 'Workshop' | 'Scholarship' | 'College Event';
  location: string;
  deadline: string;
  stipendOrPrize: string;
  description: string;
  applyUrl: string;
  tags: string[];
  userStatuses: { [userId: string]: 'Interested' | 'Applied' | 'Shortlisted' | 'Selected' | 'Rejected' };
  bookmarkedBy: string[];
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'workspace' | 'resource' | 'project' | 'discussion' | 'quiz' | 'system';
  link?: string;
  isRead: boolean;
  createdAt: string;
}
