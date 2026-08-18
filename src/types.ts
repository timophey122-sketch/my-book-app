export type Role = 'parent' | 'child';
export type ThemeMode = 'dark' | 'light';
export type MascotStyle = 'cute' | 'adventure' | 'scholar';

export interface ParentUser {
  id: string;
  uid: string;
  role: 'parent';
  familyId: string;
  familyCode: string;
  email: string;
  displayName: string;
}

export interface ChildUser {
  id: string;
  role: 'child';
  familyId: string;
  parentId: string;
  familyCode: string;
  displayName: string;
  xp: number;
  level: number;
  streak: number;
  mascotStyle: MascotStyle;
}

export interface Book {
  id: string;
  familyId: string;
  childId: string;
  title: string;
  totalPages: number;
  dailyNorm: number;
  pagesRead: number;
  status: 'reading' | 'finished';
  quizPassed: boolean;
  selectedRewardId: string | null;
  selectedRewardTitle: string | null;
}

export interface Reward {
  id: string;
  familyId: string;
  childId: string;
  bookId: string;
  bookTitle: string;
  title: string;
  description: string;
  cost: number;
  isClaimed: boolean;
}

export interface ReadingEvent {
  id: string;
  type: 'bookFinished' | 'quizPassed' | 'rewardSelected' | 'readingProgress' | 'inactiveReading';
  childId: string;
  childName: string;
  bookTitle?: string;
  rewardTitle?: string;
  pagesRead?: number;
  createdAt: string;
}

export interface FamilyData {
  parent: ParentUser;
  children: ChildUser[];
  books: Book[];
  rewards: Reward[];
  events: ReadingEvent[];
}
