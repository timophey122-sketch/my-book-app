import React, { useState } from 'react';
import { Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { achievements, COLORS } from './constants';
import { BottomTabs, Card, MagicBackground, MagicMascot, PrimaryButton, ProgressBar, ui } from './components';
import { useFamilyStore } from './FamilyStore';
import { MascotStyle } from './types';

const tabs = [{ id: 'library', icon: '📚', title: 'Книги' }, { id: 'path', icon: '🗺️', title: 'Путь' }, { id: 'achievements', icon: '🏆', title: 'Награды' }, { id: 'settings', icon: '⚙️', title: 'Настройки' }];
const mascotNames: { id: MascotStyle; title: string }[] = [{ id: 'cute', title: 'Добрый маг' }, { id: 'adventure', title: 'Искатель' }, { id: 'scholar', title: 'Мудрец' }];

export function ChildHomeScreen({ onLogout }: { onLogout(): void }) {
  const { data, updateProgress, passQuiz, selectReward, updateChild } = useFamilyStore();
  const child = data.children[0];
  const [tab, setTab] = useState('library');
  if (!child) return null;
  const books = data.books.filter((item) => item.childId === child.id);
  const rewards = data.rewards.filter((item) => item.childId === child.id);
  const pages = books.reduce((sum, book) => sum + book.pagesRead, 0);
  const finished = books.filter((book) => book.status === 'finished').length;

  return <MagicBackground><ScrollView contentContainerStyle={ui.content}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}><MagicMascot size={82} styleId={child.mascotStyle} /><View style={{ flex: 1 }}><Text style={ui.brand}>ВОЛШЕБНАЯ БИБЛИОТЕКА</Text><Text style={ui.title}>{child.displayName}</Text><Text style={ui.subtitle}>Уровень {child.level} · {child.xp} XP · 🔥 {child.streak}</Text></View></View>
    <Card><Text style={ui.label}>ДО НОВОГО УРОВНЯ</Text><ProgressBar value={child.xp % 100} /><Text style={[ui.body, { marginTop: 7 }]}>{child.xp % 100} / 100 XP</Text></Card>
    {tab === 'library' && <><Text style={ui.sectionTitle}>Мои книги</Text>{books.map((book) => <Card key={book.id}><Text style={ui.itemTitle}>{book.title}</Text><Text style={ui.body}>{book.pagesRead} из {book.totalPages} страниц</Text><ProgressBar value={book.pagesRead / book.totalPages * 100} />
      {book.status === 'reading' ? <PrimaryButton title={`Прочитал ещё ${book.dailyNorm} стр.`} onPress={() => updateProgress(book.id, book.pagesRead + book.dailyNorm)} /> : !book.quizPassed ? <PrimaryButton title="Пройти тест" onPress={() => Alert.alert('Тест по книге', 'Какой герой запомнился тебе больше всего?', [{ text: 'Я ответил!', onPress: () => passQuiz(book.id) }])} /> : <Text style={[ui.label, { marginTop: 12, color: COLORS.success }]}>✓ ТЕСТ ПРОЙДЕН · МОЖНО ВЫБРАТЬ НАГРАДУ</Text>}
      {book.quizPassed && !book.selectedRewardId && rewards.filter((reward) => reward.bookId === book.id).map((reward) => <TouchableOpacity key={reward.id} onPress={() => child.xp >= reward.cost ? selectReward(book.id, reward.id) : Alert.alert('Пока не хватает XP')} style={[ui.chip, { marginTop: 9 }]}><Text style={ui.chipText}>🎁 {reward.title} · {reward.cost} XP</Text></TouchableOpacity>)}
      {book.selectedRewardTitle && <Text style={[ui.itemTitle, { color: COLORS.gold, marginTop: 12 }]}>🎁 Выбрано: {book.selectedRewardTitle}</Text>}
    </Card>)}{!books.length && <Card><Text style={ui.body}>Родитель пока не добавил книгу.</Text></Card>}</>}
    {tab === 'path' && <><Text style={ui.sectionTitle}>Дорожка чтения</Text><Card><Text style={ui.itemTitle}>Твоя серия: {child.streak} дней 🔥</Text><Text style={ui.body}>Каждый день чтения открывает новый остров.</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 }}>{Array.from({ length: 14 }, (_, index) => <View key={index} style={{ width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: index < child.streak ? COLORS.primary : COLORS.cardStrong, borderWidth: 2, borderColor: index < child.streak ? COLORS.gold : COLORS.border }}><Text>{index < child.streak ? '★' : index + 1}</Text></View>)}</View></Card><Card><Text style={ui.itemTitle}>Прочитано {pages} страниц</Text><Text style={ui.body}>Закончено книг: {finished}</Text></Card></>}
    {tab === 'achievements' && <><Text style={ui.sectionTitle}>Достижения</Text>{achievements.map((achievement) => { const unlocked = achievement.test(pages, books.length, finished, child.streak); return <Card key={achievement.id} style={!unlocked ? { opacity: .55 } : undefined}><View style={ui.row}><Text style={{ fontSize: 36 }}>{unlocked ? achievement.icon : '🔒'}</Text><View style={{ flex: 1 }}><Text style={ui.itemTitle}>{achievement.title}</Text><Text style={ui.body}>{achievement.description}</Text><Text style={[ui.label, { marginTop: 6, color: unlocked ? COLORS.success : COLORS.muted }]}>{unlocked ? 'ОТКРЫТО' : 'ЗАКРЫТО'}</Text></View></View></Card>; })}</>}
    {tab === 'settings' && <><Text style={ui.sectionTitle}>Мой волшебник</Text><View style={ui.row}>{mascotNames.map((item) => <TouchableOpacity key={item.id} onPress={() => updateChild(child.id, { mascotStyle: item.id })} style={[{ flex: 1, alignItems: 'center', padding: 8, borderRadius: 12, borderWidth: 2, borderColor: child.mascotStyle === item.id ? COLORS.primary : COLORS.border }]}><MagicMascot size={62} styleId={item.id} /><Text style={[ui.body, { fontSize: 11, textAlign: 'center', fontWeight: '900' }]}>{item.title}</Text></TouchableOpacity>)}</View><Card style={{ marginTop: 14 }}><Text style={ui.itemTitle}>Напоминания о чтении</Text><Text style={ui.body}>«Книга ждёт тебя» и «Продолжи свою серию».</Text></Card><PrimaryButton title="Выйти" onPress={onLogout} /></>}
  </ScrollView><BottomTabs active={tab} tabs={tabs} onChange={setTab} /></MagicBackground>;
}
