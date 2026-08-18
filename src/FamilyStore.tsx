import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { demoFamily } from './constants';
import { Book, ChildUser, FamilyData, ReadingEvent, Reward } from './types';

const STORAGE_KEY = 'MBTF_RECOVERED_FAMILY';
const cloneDemo = (): FamilyData => JSON.parse(JSON.stringify(demoFamily));

type Store = {
  data: FamilyData;
  ready: boolean;
  resetDemo(): void;
  addBook(input: Pick<Book, 'childId' | 'title' | 'totalPages' | 'dailyNorm'>): void;
  updateProgress(bookId: string, pages: number): void;
  passQuiz(bookId: string): void;
  addReward(input: Pick<Reward, 'childId' | 'bookId' | 'title' | 'description' | 'cost'>): void;
  selectReward(bookId: string, rewardId: string): void;
  updateChild(childId: string, patch: Partial<ChildUser>): void;
};

const FamilyContext = createContext<Store | null>(null);
const makeId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function FamilyStoreProvider({ children }: PropsWithChildren) {
  const [data, setData] = useState<FamilyData>(cloneDemo);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved) setData(JSON.parse(saved));
    }).finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (ready) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data, ready]);

  const addEvent = (event: Omit<ReadingEvent, 'id' | 'createdAt'>, current: FamilyData) => [
    { ...event, id: makeId('event'), createdAt: new Date().toISOString() },
    ...current.events,
  ];

  const value = useMemo<Store>(() => ({
    data,
    ready,
    resetDemo: () => setData(cloneDemo()),
    addBook: (input) => setData((current) => ({
      ...current,
      books: [{
        ...input,
        id: makeId('book'), familyId: current.parent.familyId, pagesRead: 0,
        status: 'reading', quizPassed: false, selectedRewardId: null, selectedRewardTitle: null,
      }, ...current.books],
    })),
    updateProgress: (bookId, pages) => setData((current) => {
      const book = current.books.find((item) => item.id === bookId);
      if (!book) return current;
      const nextPages = Math.max(0, Math.min(book.totalPages, pages));
      const child = current.children.find((item) => item.id === book.childId);
      const gained = Math.max(0, nextPages - book.pagesRead);
      return {
        ...current,
        children: current.children.map((item) => item.id === book.childId ? { ...item, xp: item.xp + gained, level: Math.max(1, Math.floor((item.xp + gained) / 100) + 1) } : item),
        books: current.books.map((item) => item.id === bookId ? { ...item, pagesRead: nextPages, status: nextPages >= item.totalPages ? 'finished' : 'reading' } : item),
        events: addEvent({ type: nextPages >= book.totalPages ? 'bookFinished' : 'readingProgress', childId: book.childId, childName: child?.displayName ?? 'Ребёнок', bookTitle: book.title, pagesRead: gained }, current),
      };
    }),
    passQuiz: (bookId) => setData((current) => {
      const book = current.books.find((item) => item.id === bookId);
      if (!book) return current;
      const child = current.children.find((item) => item.id === book.childId);
      return {
        ...current,
        children: current.children.map((item) => item.id === book.childId ? { ...item, xp: item.xp + 50, level: Math.max(1, Math.floor((item.xp + 50) / 100) + 1) } : item),
        books: current.books.map((item) => item.id === bookId ? { ...item, quizPassed: true } : item),
        events: addEvent({ type: 'quizPassed', childId: book.childId, childName: child?.displayName ?? 'Ребёнок', bookTitle: book.title }, current),
      };
    }),
    addReward: (input) => setData((current) => {
      const book = current.books.find((item) => item.id === input.bookId);
      if (!book) return current;
      return { ...current, rewards: [{ ...input, id: makeId('reward'), familyId: current.parent.familyId, bookTitle: book.title, isClaimed: false }, ...current.rewards] };
    }),
    selectReward: (bookId, rewardId) => setData((current) => {
      const book = current.books.find((item) => item.id === bookId);
      const reward = current.rewards.find((item) => item.id === rewardId);
      const child = current.children.find((item) => item.id === book?.childId);
      if (!book || !reward || !child || child.xp < reward.cost || book.selectedRewardId) return current;
      return {
        ...current,
        children: current.children.map((item) => item.id === child.id ? { ...item, xp: item.xp - reward.cost } : item),
        books: current.books.map((item) => item.id === bookId ? { ...item, selectedRewardId: reward.id, selectedRewardTitle: reward.title } : item),
        rewards: current.rewards.map((item) => item.id === rewardId ? { ...item, isClaimed: true } : item),
        events: addEvent({ type: 'rewardSelected', childId: child.id, childName: child.displayName, bookTitle: book.title, rewardTitle: reward.title }, current),
      };
    }),
    updateChild: (childId, patch) => setData((current) => ({ ...current, children: current.children.map((item) => item.id === childId ? { ...item, ...patch } : item) })),
  }), [data, ready]);

  return <FamilyContext.Provider value={value}>{children}</FamilyContext.Provider>;
}

export function useFamilyStore() {
  const value = useContext(FamilyContext);
  if (!value) throw new Error('useFamilyStore must be inside FamilyStoreProvider');
  return value;
}
