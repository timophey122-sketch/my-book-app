import { FamilyData } from './types';

export const COLORS = {
  background: '#071b13',
  card: '#221d18',
  cardStrong: '#191511',
  border: '#493a31',
  text: '#fff8ec',
  muted: '#d7cbbb',
  primary: '#f59d35',
  primaryText: '#1b120c',
  danger: '#ff6b6b',
  success: '#69d39c',
  cyan: '#8de8ff',
  gold: '#ffe176',
};

export const FIRESTORE_COLLECTIONS = {
  users: 'users',
  books: 'books',
  rewards: 'rewards',
  progress: 'progress',
  events: 'events',
} as const;

export const demoFamily: FamilyData = {
  parent: {
    id: 'developer-parent', uid: 'developer-parent', role: 'parent',
    familyId: 'developer-family', familyCode: 'MBT-DEMO-2026',
    email: 'parent@example.com', displayName: 'Тимофей',
  },
  children: [
    { id: 'developer-child', role: 'child', familyId: 'developer-family', parentId: 'developer-parent', familyCode: 'MBT-DEMO-2026', displayName: 'Юный читатель', xp: 180, level: 3, streak: 5, mascotStyle: 'cute' },
    { id: 'developer-child-2', role: 'child', familyId: 'developer-family', parentId: 'developer-parent', familyCode: 'MBT-DEMO-2026', displayName: 'Книжный маг', xp: 90, level: 2, streak: 2, mascotStyle: 'scholar' },
  ],
  books: [
    { id: 'book-1', familyId: 'developer-family', childId: 'developer-child', title: 'Хроники Нарнии', totalPages: 240, dailyNorm: 15, pagesRead: 96, status: 'reading', quizPassed: false, selectedRewardId: null, selectedRewardTitle: null },
    { id: 'book-2', familyId: 'developer-family', childId: 'developer-child', title: 'Маленький принц', totalPages: 112, dailyNorm: 10, pagesRead: 112, status: 'finished', quizPassed: true, selectedRewardId: null, selectedRewardTitle: null },
  ],
  rewards: [
    { id: 'reward-1', familyId: 'developer-family', childId: 'developer-child', bookId: 'book-1', bookTitle: 'Хроники Нарнии', title: 'Поход в кино', description: 'Выбрать фильм для семейного вечера', cost: 150, isClaimed: false },
    { id: 'reward-2', familyId: 'developer-family', childId: 'developer-child', bookId: 'book-1', bookTitle: 'Хроники Нарнии', title: 'Любимый десерт', description: 'Приготовить десерт вместе', cost: 100, isClaimed: false },
  ],
  events: [
    { id: 'event-1', type: 'readingProgress', childId: 'developer-child', childName: 'Юный читатель', bookTitle: 'Хроники Нарнии', pagesRead: 15, createdAt: new Date().toISOString() },
  ],
};

export const achievements = [
  { id: 'first_pages', icon: '📖', title: 'Первые страницы', description: 'Прочитать первые 10 страниц', test: (pages: number, books: number, finished: number, streak: number) => pages >= 10 },
  { id: 'book_finished', icon: '🏆', title: 'Первая книга', description: 'Закончить одну книгу', test: (pages: number, books: number, finished: number, streak: number) => finished >= 1 },
  { id: 'streak_week', icon: '🔥', title: 'Неделя чтения', description: 'Читать 7 дней подряд', test: (pages: number, books: number, finished: number, streak: number) => streak >= 7 },
  { id: 'book_collector', icon: '📚', title: 'Коллекционер', description: 'Добавить три книги', test: (pages: number, books: number) => books >= 3 },
];
