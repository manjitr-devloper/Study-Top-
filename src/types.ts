export type MasteryLevel = 'beginner' | 'intermediate' | 'advanced' | 'mastered';
export type Priority = 'low' | 'medium' | 'high';

export interface Message {
  role: 'user' | 'model';
  content: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  lastLogin: number;
  language?: string;
  profession?: string;
  tutorialCompleted?: boolean;
  examDate?: string;
  examName?: string;
}

export interface NotebookSource {
  id: string;
  title: string;
  type: 'pdf' | 'youtube' | 'text' | 'image' | 'web';
  content: string;
  url?: string;
  selected: boolean;
  dateAdded: number;
  size?: string;
}

export interface AudioOverviewData {
  status: 'idle' | 'generating' | 'ready';
  title?: string;
  duration?: number;
  transcript?: { speaker: string; text: string; time?: string }[];
  audioUrl?: string;
}

export interface StudioNoteItem {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  color?: string;
  pinned?: boolean;
}

export interface NoteFlashcard {
  id: string;
  front: string;
  back: string;
  question?: string;
  answer?: string;
  mastered?: boolean;
  createdAt?: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  userId: string;
  createdAt: number;
  updatedAt: number;
  level?: MasteryLevel;
  tags?: string[];
  quickSummary?: string;
  sources?: NotebookSource[];
  audioOverview?: AudioOverviewData;
  studioNotes?: StudioNoteItem[];
  folderId?: string;
  isDeleted?: boolean;
  deletedAt?: number;
  isFavorite?: boolean;
  diagramCode?: string;
  flashcards?: NoteFlashcard[];
  quizzes?: QuizQuestion[];
  structuredData?: any;
}

export interface DiagramItem {
  id: string;
  title: string;
  code: string;
  type: string;
  updatedAt: number;
  noteId?: string;
}

export interface StudyFolder {
  id: string;
  name: string;
  color?: string;
  icon?: string;
  userId?: string;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  location?: string;
  noteId?: string;
  dueDate?: number;
  priority: Priority;
  completed: boolean;
  userId: string;
  createdAt: number;
  updatedAt: number;
  tags?: string[];
  folderId?: string;
}

export interface TaskFolder {
  id: string;
  name: string;
  userId: string;
  color?: string;
  createdAt: number;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface StudyGuide {
  summary: string;
  quickSummary: string;
  keyTerms: { term: string; definition: string }[];
  concepts: { title: string; explanation: string }[];
  learningObjectives: string[];
  revisionTips: string[];
}

export interface Classroom {
  id: string;
  name: string;
  joinCode: string;
  teacherId: string;
  studentIds: string[];
  createdAt: number;
}

export interface ClassroomMessage {
  id: string;
  classroomId: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: number;
}

export interface ClassroomHomework {
  id: string;
  classroomId: string;
  title: string;
  description: string;
  dueDate: number;
  createdAt: number;
}

export interface HomeworkSubmission {
  id: string;
  homeworkId: string;
  studentId: string;
  content: string;
  grade?: string;
  createdAt: number;
}

export interface QuizResult {
  id: string;
  categoryId: string;
  score: number;
  total: number;
  userId: string;
  createdAt: number;
}

