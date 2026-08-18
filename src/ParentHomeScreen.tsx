import React, { useMemo, useState } from 'react';
import { Alert, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { BottomTabs, Card, MagicBackground, MagicMascot, PrimaryButton, ProgressBar, Sheet, ui } from './components';
import { COLORS } from './constants';
import { useFamilyStore } from './FamilyStore';

const tabs = [{ id: 'home', icon: '🏠', title: 'Главная' }, { id: 'rewards', icon: '🎁', title: 'Награды' }, { id: 'settings', icon: '⚙️', title: 'Настройки' }];

export function ParentHomeScreen({ onLogout }: { onLogout(): void }) {
  const { data, addBook, addReward, resetDemo } = useFamilyStore();
  const [tab, setTab] = useState('home');
  const [childId, setChildId] = useState(data.children[0]?.id ?? '');
  const [bookSheet, setBookSheet] = useState(false);
  const [rewardSheet, setRewardSheet] = useState(false);
  const [title, setTitle] = useState('');
  const [pages, setPages] = useState('');
  const [norm, setNorm] = useState('10');
  const [rewardTitle, setRewardTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('100');
  const [notifications, setNotifications] = useState(true);
  const child = data.children.find((item) => item.id === childId) ?? data.children[0];
  const books = data.books.filter((item) => item.childId === child?.id);
  const childRewards = data.rewards.filter((item) => item.childId === child?.id);
  const pagesRead = books.reduce((sum, book) => sum + book.pagesRead, 0);
  const selectedBook = books[0];
  const recentEvents = data.events.filter((event) => event.childId === child?.id).slice(0, 4);
  const notificationLabels: Record<string, string> = { bookFinished: 'Книга закончена', quizPassed: 'Тест пройден', rewardSelected: 'Награда выбрана', readingProgress: 'Новый прогресс', inactiveReading: 'Давно не читал' };

  const header = useMemo(() => <><Text style={ui.brand}>АККАУНТ РОДИТЕЛЯ</Text><Text style={ui.title}>Семья {data.parent.displayName}</Text><Text style={ui.subtitle}>Код семьи: <Text style={{ color: COLORS.cyan, fontWeight: '900' }}>{data.parent.familyCode}</Text></Text></>, [data.parent]);

  const saveBook = () => {
    if (!child || !title.trim() || Number(pages) <= 0) return Alert.alert('Проверьте книгу', 'Введите название и количество страниц.');
    addBook({ childId: child.id, title: title.trim(), totalPages: Number(pages), dailyNorm: Math.max(1, Number(norm) || 10) });
    setTitle(''); setPages(''); setBookSheet(false);
  };
  const saveReward = () => {
    if (!child || !selectedBook || !rewardTitle.trim()) return Alert.alert('Введите награду');
    if (data.rewards.filter((item) => item.bookId === selectedBook.id).length >= 5) return Alert.alert('Лимит наград', 'Можно добавить до 5 наград за одну книгу.');
    addReward({ childId: child.id, bookId: selectedBook.id, title: rewardTitle.trim(), description: description.trim(), cost: Math.max(0, Number(cost) || 0) });
    setRewardTitle(''); setDescription(''); setRewardSheet(false);
  };

  return <MagicBackground><ScrollView contentContainerStyle={ui.content}>{header}
    <View style={[ui.chips, { marginVertical: 14 }]}>{data.children.map((item) => <TouchableOpacity key={item.id} onPress={() => setChildId(item.id)} style={[ui.chip, child?.id === item.id && ui.chipActive]}><Text style={[ui.chipText, child?.id === item.id && ui.chipTextActive]}>{item.displayName}</Text></TouchableOpacity>)}</View>
    {child && tab === 'home' && <>
      <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}><MagicMascot size={76} styleId={child.mascotStyle} /><View style={{ flex: 1 }}><Text style={ui.itemTitle}>{child.displayName}</Text><Text style={ui.body}>Уровень {child.level} · {child.xp} XP · серия {child.streak} дней 🔥</Text><ProgressBar value={(child.xp % 100)} /></View></Card>
      <View style={ui.row}><Card style={{ flex: 1 }}><Text style={ui.label}>КНИГИ</Text><Text style={ui.title}>{books.length}</Text></Card><Card style={{ flex: 1 }}><Text style={ui.label}>СТРАНИЦЫ</Text><Text style={ui.title}>{pagesRead}</Text></Card></View>
      <Text style={ui.sectionTitle}>Книги ребёнка</Text>{books.length ? books.map((book) => <Card key={book.id}><Text style={ui.itemTitle}>{book.title}</Text><Text style={ui.body}>{book.pagesRead} из {book.totalPages} стр. · норма {book.dailyNorm}</Text><ProgressBar value={book.pagesRead / book.totalPages * 100} />{book.status === 'finished' && <Text style={[ui.label, { marginTop: 10, color: COLORS.success }]}>✓ КНИГА ПРОЧИТАНА {book.quizPassed ? '· ТЕСТ ПРОЙДЕН' : ''}</Text>}</Card>) : <Card><Text style={ui.body}>Добавьте первую книгу и следите за прогрессом по дням.</Text></Card>}
      <PrimaryButton title="＋ Добавить книгу" onPress={() => setBookSheet(true)} />
      <Text style={[ui.sectionTitle, { marginTop: 20 }]}>Последние события</Text>{recentEvents.map((event) => <Card key={event.id}><Text style={ui.itemTitle}>{notificationLabels[event.type] ?? event.type}</Text><Text style={ui.body}>{event.childName}{event.bookTitle ? ` · ${event.bookTitle}` : ''}{event.rewardTitle ? ` · ${event.rewardTitle}` : ''}</Text></Card>)}
    </>}
    {child && tab === 'rewards' && <><Text style={ui.sectionTitle}>Награды для {child.displayName}</Text>{childRewards.length ? childRewards.map((reward) => <Card key={reward.id}><View style={ui.row}><Text style={{ fontSize: 32 }}>{reward.isClaimed ? '✅' : '🎁'}</Text><View style={{ flex: 1 }}><Text style={ui.itemTitle}>{reward.title}</Text><Text style={ui.body}>{reward.description || reward.bookTitle}</Text><Text style={[ui.label, { marginTop: 8 }]}>{reward.cost} XP · {reward.isClaimed ? 'выбрана ребёнком' : 'доступна после теста'}</Text></View></View></Card>) : <Card><Text style={ui.body}>Для этого ребёнка пока нет наград.</Text></Card>}<PrimaryButton title="＋ Добавить награду" onPress={() => selectedBook ? setRewardSheet(true) : Alert.alert('Сначала добавьте книгу')} /></>}
    {tab === 'settings' && <><Text style={ui.sectionTitle}>Настройки семьи</Text><Card><View style={[ui.row, { justifyContent: 'space-between' }]}><View style={{ flex: 1 }}><Text style={ui.itemTitle}>Уведления</Text><Text style={ui.body}>Книги, тесты, награды и прогресс ребёнка.</Text></View><Switch value={notifications} onValueChange={setNotifications} trackColor={{ true: COLORS.primary }} /></View></Card><Card><Text style={ui.itemTitle}>Firebase</Text><Text style={ui.body}>Схема сервера восстановлена. Подключение включается через переменные EXPO_PUBLIC_FIREBASE_*.</Text></Card><PrimaryButton title="Сбросить демонстрационные данные" onPress={() => Alert.alert('Сбросить демо?', 'Локальные изменения будут удалены.', [{ text: 'Отмена' }, { text: 'Сбросить', style: 'destructive', onPress: resetDemo }])} danger /><PrimaryButton title="Выйти" onPress={onLogout} /></>}
  </ScrollView><BottomTabs active={tab} tabs={tabs} onChange={setTab} />
  <Sheet visible={bookSheet} title="Добавить книгу" onClose={() => setBookSheet(false)}><TextInput value={title} onChangeText={setTitle} placeholder="Название книги" placeholderTextColor="#8c8277" style={ui.input} /><TextInput value={pages} onChangeText={setPages} placeholder="Количество страниц" placeholderTextColor="#8c8277" keyboardType="number-pad" style={ui.input} /><TextInput value={norm} onChangeText={setNorm} placeholder="Дневная норма" placeholderTextColor="#8c8277" keyboardType="number-pad" style={ui.input} /><PrimaryButton title="Добавить" onPress={saveBook} /></Sheet>
  <Sheet visible={rewardSheet} title="Добавить награду" onClose={() => setRewardSheet(false)}><Text style={[ui.body, { marginBottom: 10 }]}>Книга: {selectedBook?.title}</Text><TextInput value={rewardTitle} onChangeText={setRewardTitle} placeholder="Название награды" placeholderTextColor="#8c8277" style={ui.input} /><TextInput value={description} onChangeText={setDescription} placeholder="Описание" placeholderTextColor="#8c8277" style={ui.input} /><TextInput value={cost} onChangeText={setCost} placeholder="Стоимость XP" placeholderTextColor="#8c8277" keyboardType="number-pad" style={ui.input} /><PrimaryButton title="Добавить награду" onPress={saveReward} /></Sheet>
  </MagicBackground>;
}
