import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, AppState, Dimensions, KeyboardAvoidingView, Linking, Modal, Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { LANGUAGES, TEXT } from './src/i18n';
import { BACKGROUND_LABELS, CLASSIC_TEXT } from './src/backgroundLabels';

const { width } = Dimensions.get('window');
const BOOKS_KEY = 'MY_BOOK_TRACKER_CLASSIC_BOOKS_V3';
const SETTINGS_KEY = 'MY_BOOK_TRACKER_CLASSIC_SETTINGS_V3';
const RTL_LANGUAGES = new Set(['ar', 'fa', 'ur', 'he']);
const REMINDER_ID_KEY = 'MY_BOOK_TRACKER_CLASSIC_REMINDER_ID';
const REMINDER_CHANNEL = 'my-book-tracker-reading-reminders';

Notifications.setNotificationHandler({ handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }) });
const BACKGROUNDS = [
  ['paper', '#211913', '#8c5218'], ['midnight', '#071329', '#3156a5'], ['forest', '#05231a', '#247349'],
  ['ocean', '#042833', '#258ca5'], ['rose', '#32101f', '#a83466'], ['lavender', '#241535', '#7350b7'],
  ['mint', '#06352a', '#28a681'], ['sand', '#35250d', '#ad7b1e'], ['charcoal', '#151a1d', '#69757a'],
  ['sky', '#092b46', '#388fd0'], ['coffee', '#342017', '#915a3e'], ['grape', '#2d0b38', '#9232aa'],
  ['sunset', '#3b1710', '#c5552a'], ['ice', '#07333d', '#47a9bc'], ['ink', '#111531', '#454e91'],
];

const EN = {
  brand: 'MY BOOK TRACKER', appSettings: 'App settings', settingsHint: 'Choose interface language, theme and background. Settings are saved automatically.',
  background: 'App background', addBook: 'Add book', editBook: 'Edit book', titlePlaceholder: 'Enter book title',
  leftOfTotal: (left, total) => `${left} of ${total} pages left`, calendarSub: (left, norm) => `${left} pages left · Daily goal ${norm}`,
  todayHint: 'go to today', pagesQuestion: 'How many pages did you read?', selectedFuture: 'You can view this day, but pages can only be entered for today or past days.',
  backToLibrary: 'Back · Library', bookCompleted: 'Book completed! 🎉', quizCreating: 'Creating the quiz', quizWait: 'Please wait while book information is checked.',
  quizError: 'A reliable quiz could not be created for this title. Check the title and internet connection.', question: 'Question', of: 'of',
  next: 'Next question', finish: 'Finish test', hint: 'Hint', passed: 'Test passed!', failed: 'Test not passed', result: 'Result', retry: 'Try again',
  developerMode: 'Developer mode', developerSaved: 'Developer mode is saved on this device.', exitDeveloper: 'Exit developer mode', developerPassword: 'Developer password', unlock: 'Unlock', wrongPassword: 'Wrong password',
  notificationsInfo: 'Reading reminders are controlled by the device.', openNotificationSettings: 'Notification settings', review: 'Leave a review',
  paper: 'Paper', midnight: 'Midnight', forest: 'Forest', ocean: 'Ocean', rose: 'Rose', lavender: 'Lavender', mint: 'Mint', sand: 'Sand', charcoal: 'Charcoal', sky: 'Sky', coffee: 'Coffee', grape: 'Grape', sunset: 'Sunset', ice: 'Ice', ink: 'Ink',
};
const RU = {
  brand: 'MY BOOK TRACKER', appSettings: 'Настройки приложения', settingsHint: 'Выберите язык, тему и фон. Настройки сохраняются автоматически.',
  background: 'Фон приложения', addBook: 'Добавить книгу', editBook: 'Изменить книгу', titlePlaceholder: 'Введите название книги',
  leftOfTotal: (left, total) => `Осталось ${left} стр. из ${total}`, calendarSub: (left, norm) => `Осталось ${left} стр. · Норма ${norm}`,
  todayHint: 'к сегодняшнему дню', pagesQuestion: 'Сколько страниц прочитано?', selectedFuture: 'Этот день можно посмотреть, но вводить страницы можно только за сегодня или прошедшие дни.',
  backToLibrary: 'Назад · Библиотека', bookCompleted: 'Книга прочитана! 🎉', quizCreating: 'Создаётся тест', quizWait: 'Подождите, проверяем сведения о книге.',
  quizError: 'Не удалось создать надёжный тест для этой книги. Проверьте название и интернет.', question: 'Вопрос', of: 'из',
  next: 'Следующий вопрос', finish: 'Завершить тест', hint: 'Подсказка', passed: 'Тест пройден!', failed: 'Тест не пройден', result: 'Результат', retry: 'Попробовать снова',
  developerMode: 'Режим разработчика', developerSaved: 'Режим разработчика сохранён на этом устройстве.', exitDeveloper: 'Выйти из режима разработчика', developerPassword: 'Пароль разработчика', unlock: 'Открыть', wrongPassword: 'Неверный пароль',
  notificationsInfo: 'Напоминания о чтении управляются настройками устройства.', openNotificationSettings: 'Настройки уведомлений', review: 'Оставить отзыв',
  paper: 'Бумага', midnight: 'Полночь', forest: 'Лес', ocean: 'Океан', rose: 'Роза', lavender: 'Лаванда', mint: 'Мята', sand: 'Песок', charcoal: 'Графит', sky: 'Небо', coffee: 'Кофе', grape: 'Виноград', sunset: 'Закат', ice: 'Лёд', ink: 'Чернила',
};

const normalizeSettings = (saved) => ({
  language: saved?.language || 'en', theme: saved?.theme === 'dark' ? 'dark' : 'light',
  background: BACKGROUNDS.some(([id]) => id === saved?.background) ? saved.background : 'paper', developer: saved?.developer === true, notifications: saved?.notifications === true,
});
const syncReadingReminder = async (enabled, language) => {
  const previousId = await AsyncStorage.getItem(REMINDER_ID_KEY);
  if (previousId) { await Notifications.cancelScheduledNotificationAsync(previousId).catch(() => {}); await AsyncStorage.removeItem(REMINDER_ID_KEY); }
  if (!enabled) return;
  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') return;
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, { name: 'Reading reminders', importance: Notifications.AndroidImportance.HIGH, sound: 'default', vibrationPattern: [0, 250, 150, 250] });
  const words = TEXT[language] || TEXT.en;
  const id = await Notifications.scheduleNotificationAsync({ content: { title: 'My Book Tracker', body: words.reminder1 || TEXT.en.reminder1, sound: 'default' }, trigger: { seconds: 90 * 60, repeats: true, ...(Platform.OS === 'android' ? { channelId: REMINDER_CHANNEL } : {}) } });
  await AsyncStorage.setItem(REMINDER_ID_KEY, id);
};
const startOfWeek = (value) => { const d = new Date(value); d.setHours(12, 0, 0, 0); const day = d.getDay(); d.setDate(d.getDate() - day + (day === 0 ? -6 : 1)); return d; };
const dateKey = (value) => { const d = new Date(value); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const unique = (items) => [...new Set(items.filter(Boolean).map((item) => String(item).trim()).filter(Boolean))];
const shuffled = (items) => [...items].sort(() => Math.random() - 0.5);
const translateOne = async (text, language) => {
  if (language === 'en') return text;
  const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(language)}&dt=t&q=${encodeURIComponent(text)}`);
  if (!response.ok) return text;
  const payload = await response.json(); return payload?.[0]?.map((part) => part?.[0] || '').join('') || text;
};
const buildQuestion = (prompt, correct, wrong) => {
  const alternatives = unique(wrong).filter((item) => item.toLowerCase() !== String(correct).toLowerCase()).slice(0, 4);
  if (!correct || alternatives.length < 4) return null;
  const options = shuffled([String(correct), ...alternatives]); return { prompt, options, correctIndex: options.indexOf(String(correct)) };
};
const createStoryQuestions = async (book) => {
  try {
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(`${book.title} book novel`)}&gsrlimit=5&prop=extracts&explaintext=1&exlimit=5&format=json&origin=*`;
    const response = await fetch(searchUrl);
    if (!response.ok) return [];
    const payload = await response.json();
  const pages = Object.values(payload?.query?.pages || {}).sort((a, b) => (a.index || 99) - (b.index || 99));
  const page = pages.find((item) => String(item.extract || '').length > 800) || pages[0];
  const extract = String(page?.extract || '').replace(/\s+/g, ' ').trim();
  if (!extract) return [];
  const sentences = extract.match(/[^.!?]{45,260}[.!?]/g) || [];
  const entityPattern = /\p{Lu}[\p{L}\p{M}'’.-]{2,}(?:\s+(?:of|the|de|van|von|и|аль-)?\s*\p{Lu}[\p{L}\p{M}'’.-]{2,}){0,2}/gu;
  const entityPool = unique(sentences.flatMap((sentence) => sentence.match(entityPattern) || []))
    .filter((entity) => !['The', 'This', 'When', 'After', 'During', 'However', 'Although', 'Book'].includes(entity));
  const questions = [];
  for (const sentence of shuffled(sentences)) {
    const entities = unique(sentence.match(entityPattern) || []).filter((entity) => entityPool.includes(entity));
    const correct = entities.find((entity) => entity.length >= 4 && !book.title.toLowerCase().includes(entity.toLowerCase()));
    if (!correct) continue;
    const sameShape = entityPool.filter((entity) => entity !== correct && Math.abs(entity.split(' ').length - correct.split(' ').length) <= 1);
    const question = buildQuestion(`Which name or place completes this detail from “${book.title}”?\n“${sentence.replace(correct, '_____')}”`, correct, shuffled(sameShape));
    if (question && !questions.some((item) => item.prompt === question.prompt)) questions.push(question);
    if (questions.length === 5) break;
  }
    return questions;
  } catch {
    return [];
  }
};
const createBookQuiz = async (book, language) => {
  const storyQuestions = await createStoryQuestions(book);
  const localize = async (questions) => language === 'en' ? questions : Promise.all(questions.map(async (question) => ({
    ...question,
    prompt: await translateOne(question.prompt, language),
    options: await Promise.all(question.options.map((option) => translateOne(option, language))),
  })));
  if (storyQuestions.length === 5) return localize(storyQuestions);
  const fields = 'key,title,author_name,first_publish_year,publisher,language,subject';
  const response = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(book.title)}&limit=30&fields=${fields}`);
  if (!response.ok) throw new Error('catalog');
  const payload = await response.json(); const docs = Array.isArray(payload.docs) ? payload.docs : [];
  if (!docs.length) throw new Error('not-found');
  const exact = docs.find((doc) => String(doc.title || '').toLowerCase() === book.title.trim().toLowerCase()) || docs[0];
  const authors = unique(docs.flatMap((doc) => doc.author_name || [])); const publishers = unique(docs.flatMap((doc) => doc.publisher || []));
  const subjects = unique(docs.flatMap((doc) => doc.subject || []).filter((item) => String(item).length < 55));
  const years = unique(docs.map((doc) => doc.first_publish_year)).map(String); const languages = unique(docs.flatMap((doc) => doc.language || []));
  const metadataQuestions = [
    buildQuestion(`Which author is credited for “${exact.title || book.title}”?`, exact.author_name?.[0], authors),
    buildQuestion(`In which year was “${exact.title || book.title}” first published?`, exact.first_publish_year, years),
    buildQuestion(`Which publisher has released an edition of “${exact.title || book.title}”?`, exact.publisher?.[0], publishers),
    buildQuestion(`Which subject is listed for “${exact.title || book.title}”?`, exact.subject?.[0], subjects),
    buildQuestion(`Which language code is associated with an edition of “${exact.title || book.title}”?`, exact.language?.[0], languages),
  ].filter(Boolean);
  const seed = [...storyQuestions, ...metadataQuestions].slice(0, 5);
  if (seed.length !== 5) throw new Error('insufficient-book-information');
  return localize(seed);
};

export default function App() {
  const [ready, setReady] = useState(false); const [screen, setScreen] = useState('library'); const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(null); const [form, setForm] = useState({ title: '', totalPages: '', dailyNorm: '' }); const [editingId, setEditingId] = useState(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date())); const [selectedDay, setSelectedDay] = useState(0);
  const [settings, setSettings] = useState(normalizeSettings()); const [languageOpen, setLanguageOpen] = useState(false);
  const [developerOpen, setDeveloperOpen] = useState(false); const [developerCode, setDeveloperCode] = useState(''); const [brandTaps, setBrandTaps] = useState(0);
  const [quiz, setQuiz] = useState([]); const [quizIndex, setQuizIndex] = useState(0); const [quizAnswer, setQuizAnswer] = useState(null);
  const [quizCorrect, setQuizCorrect] = useState(0); const [quizSeconds, setQuizSeconds] = useState(20); const [quizResult, setQuizResult] = useState(null);
  const saveTimer = useRef(null); const appState = useRef(AppState.currentState);
  const lang = settings.language; const shared = TEXT[lang] || TEXT.en; const local = { ...EN, ...(CLASSIC_TEXT[lang] || {}), ...(lang === 'ru' ? RU : {}) }; const rtl = RTL_LANGUAGES.has(lang);
  const tx = (key, fallback = '') => shared[key] || local[key] || EN[key] || fallback || key;
  const tr = (key, ...args) => typeof local[key] === 'function' ? local[key](...args) : tx(key);

  useEffect(() => { Promise.all([AsyncStorage.getItem(BOOKS_KEY), AsyncStorage.getItem(SETTINGS_KEY)]).then(([savedBooks, savedSettings]) => {
    try { if (savedBooks) setBooks(JSON.parse(savedBooks)); } catch {}
    try { setSettings(normalizeSettings(savedSettings ? JSON.parse(savedSettings) : null)); } catch { setSettings(normalizeSettings()); }
    setReady(true);
  }); }, []);
  useEffect(() => { if (ready) AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }, [ready, settings]);
  useEffect(() => { if (ready) syncReadingReminder(settings.notifications, settings.language).catch(() => {}); }, [ready, settings.notifications, settings.language]);
  useEffect(() => { const subscription = AppState.addEventListener('change', (next) => {
    if (screen === 'quiz' && appState.current === 'active' && next !== 'active') { setQuiz([]); setQuizIndex(0); setQuizAnswer(null); setQuizCorrect(0); setQuizResult(null); setScreen('calendar'); }
    appState.current = next;
  }); return () => subscription.remove(); }, [screen]);
  useEffect(() => { if (screen !== 'quiz' || quizResult || !quiz.length) return undefined; if (quizSeconds <= 0) { submitQuizAnswer(true); return undefined; }
    const timer = setTimeout(() => setQuizSeconds((value) => value - 1), 1000); return () => clearTimeout(timer);
  }, [screen, quizSeconds, quizResult, quiz.length, quizIndex]);

  const activeBook = useMemo(() => books.find((book) => book.id === selectedBookId), [books, selectedBookId]);
  const days = useMemo(() => Array.from({ length: 7 }, (_, index) => { const date = new Date(weekStart); date.setDate(date.getDate() + index); return date; }), [weekStart]);
  const selectedDate = days[selectedDay] || days[0]; const selectedKey = dateKey(selectedDate); const todayKey = dateKey(new Date()); const future = selectedKey > todayKey;
  const readTotal = activeBook ? Object.values(activeBook.progress || {}).reduce((sum, value) => sum + (Number(value) || 0), 0) : 0;
  const left = activeBook ? Math.max(0, activeBook.totalPages - readTotal) : 0; const completed = Boolean(activeBook && left === 0); const selectedValue = activeBook?.progress?.[selectedKey] || 0;
  const saveBooks = (next) => { setBooks(next); if (saveTimer.current) clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => AsyncStorage.setItem(BOOKS_KEY, JSON.stringify(next)), 120); };
  const openBook = (book) => { const now = new Date(); setSelectedBookId(book.id); setWeekStart(startOfWeek(now)); setSelectedDay((now.getDay() + 6) % 7); setScreen('calendar'); };
  const saveBook = () => {
    const title = form.title.trim(); const totalPages = Number(form.totalPages); const dailyNorm = Number(form.dailyNorm);
    if (!title || !Number.isInteger(totalPages) || !Number.isInteger(dailyNorm) || totalPages <= 0 || dailyNorm <= 0) { Alert.alert(tx('error'), tx('fill')); return; }
    if (editingId) {
      const current = books.find((book) => book.id === editingId); const alreadyRead = current ? Object.values(current.progress || {}).reduce((sum, value) => sum + (Number(value) || 0), 0) : 0;
      if (totalPages < alreadyRead) { Alert.alert(tx('error'), `${tx('total')}: ${alreadyRead}+`); return; }
      saveBooks(books.map((book) => book.id === editingId ? { ...book, title, totalPages, dailyNorm: Math.min(dailyNorm, totalPages) } : book));
    } else { const book = { id: `${Date.now()}`, title, totalPages, dailyNorm: Math.min(dailyNorm, totalPages), progress: {}, quizPassed: false }; saveBooks([...books, book]); setSelectedBookId(book.id); }
    setForm({ title: '', totalPages: '', dailyNorm: '' }); setEditingId(null); setScreen('library');
  };
  const editBook = (book) => { setForm({ title: book.title, totalPages: String(book.totalPages), dailyNorm: String(book.dailyNorm) }); setEditingId(book.id); setScreen('book-form'); };
  const removeBook = (book) => Alert.alert(tx('deleteBook'), book.title, [{ text: tx('cancel'), style: 'cancel' }, { text: tx('delete'), style: 'destructive', onPress: () => saveBooks(books.filter((item) => item.id !== book.id)) }]);
  const updatePages = (text) => {
    if (!activeBook || future) return; const clean = text.replace(/\D/g, ''); let value = Number(clean || 0);
    const otherDays = Object.entries(activeBook.progress || {}).reduce((sum, [key, amount]) => key === selectedKey ? sum : sum + (Number(amount) || 0), 0);
    value = Math.max(0, Math.min(value, activeBook.totalPages - otherDays));
    saveBooks(books.map((book) => book.id === activeBook.id ? { ...book, progress: { ...book.progress, [selectedKey]: value } } : book));
  };
  const moveWeek = (amount) => { const next = new Date(weekStart); next.setDate(next.getDate() + amount * 7); setWeekStart(next); setSelectedDay(0); };
  const startQuiz = async () => { setScreen('quiz-loading'); setQuizResult(null); setQuizAnswer(null); setQuizCorrect(0); setQuizIndex(0); setQuizSeconds(20);
    try { setQuiz(await createBookQuiz(activeBook, lang)); setScreen('quiz'); } catch { Alert.alert(tx('error'), local.quizError); setScreen('calendar'); }
  };
  const submitQuizAnswer = (timedOut = false) => {
    if (!timedOut && quizAnswer === null) return; const correct = quizCorrect + (quizAnswer === quiz[quizIndex].correctIndex ? 1 : 0);
    if (quizIndex === quiz.length - 1) { const passed = correct >= 4; setQuizCorrect(correct); setQuizResult({ passed, score: correct }); if (passed) saveBooks(books.map((book) => book.id === activeBook.id ? { ...book, quizPassed: true } : book)); return; }
    setQuizCorrect(correct); setQuizIndex((index) => index + 1); setQuizAnswer(null); setQuizSeconds(20);
  };
  const unlockDeveloper = () => { if (developerCode !== '1410') { Alert.alert(local.wrongPassword); return; } setSettings((value) => ({ ...value, developer: true })); setDeveloperOpen(false); setDeveloperCode(''); };
  const tapBrand = () => { const next = brandTaps + 1; setBrandTaps(next); if (next >= 5 && !settings.developer) { setBrandTaps(0); setDeveloperOpen(true); } };

  const palette = useMemo(() => { const entry = BACKGROUNDS.find(([id]) => id === settings.background) || BACKGROUNDS[0]; const dark = settings.theme === 'dark'; return {
    bg: dark ? entry[1] : '#f7f3eb', accent: dark ? entry[2] : `${entry[2]}55`, card: dark ? 'rgba(22,20,19,0.94)' : 'rgba(255,252,247,0.94)', text: dark ? '#fff8ec' : '#201b17',
    muted: dark ? '#cbbdaa' : '#766b60', border: dark ? '#625446' : '#d9cbbb', primary: '#f7a13a', tab: dark ? '#151311' : '#fffaf3', input: dark ? '#1d1a18' : '#fffaf3', success: '#65c9a2',
  }; }, [settings.background, settings.theme]);
  const styles = useMemo(() => makeStyles(palette, rtl), [palette, rtl]); const locale = lang === 'fil' ? 'fil-PH' : lang;
  const Brand = () => <TouchableOpacity activeOpacity={1} onPress={tapBrand}><Text style={styles.brand}>{settings.developer ? 'DEVELOPER · ' : ''}{local.brand}</Text></TouchableOpacity>;
  const Header = ({ title, hint }) => <View style={styles.header}><Brand/><Text style={styles.title}>{title}</Text>{hint ? <Text style={styles.hint}>{hint}</Text> : null}</View>;
  const Bottom = ({ active = 'library' }) => <View style={styles.bottom}><TouchableOpacity style={[styles.tab, active === 'library' && styles.activeTab]} onPress={() => setScreen('library')}><Text style={styles.tabIcon}>▦</Text><Text style={[styles.tabText, active === 'library' && styles.activeTabText]}>{tx('library')}</Text></TouchableOpacity><TouchableOpacity style={[styles.tab, active === 'settings' && styles.activeTab]} onPress={() => setScreen('settings')}><Text style={styles.tabIcon}>⚙</Text><Text style={[styles.tabText, active === 'settings' && styles.activeTabText]}>{tx('settings')}</Text></TouchableOpacity></View>;
  const Shell = ({ children, active, noBottom = false }) => <SafeAreaView style={styles.root}><View style={styles.accentBig}/><View style={styles.accentSmall}/><View style={styles.body}>{children}</View>{noBottom ? null : <Bottom active={active}/>}</SafeAreaView>;
  if (!ready) return <SafeAreaView style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}><Text style={styles.title}>{tx('loading')}</Text></SafeAreaView>;

  if (screen === 'settings') return <Shell active="settings"><Header title={local.appSettings} hint={local.settingsHint}/><ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
    <View style={styles.section}><Text style={styles.sectionTitle}>{tx('theme')}</Text><View style={styles.row}><TouchableOpacity style={[styles.halfButton, settings.theme === 'light' && styles.selected]} onPress={() => setSettings((value) => ({ ...value, theme: 'light' }))}><Text style={styles.buttonText}>☀ {tx('light')}</Text></TouchableOpacity><TouchableOpacity style={[styles.halfButton, settings.theme === 'dark' && styles.selected]} onPress={() => setSettings((value) => ({ ...value, theme: 'dark' }))}><Text style={styles.buttonText}>☾ {tx('dark')}</Text></TouchableOpacity></View></View>
    <View style={styles.section}><Text style={styles.sectionTitle}>{local.background}</Text><View style={styles.backgroundGrid}>{BACKGROUNDS.map(([id, dark, accent]) => <TouchableOpacity key={id} style={[styles.backgroundChoice, settings.background === id && styles.selected]} onPress={() => setSettings((value) => ({ ...value, background: id }))}><View style={[styles.backgroundPreview, { backgroundColor: dark }]}><View style={[styles.previewCircle, { backgroundColor: accent }]}/></View><Text style={styles.backgroundLabel}>{BACKGROUND_LABELS[lang]?.[id] || EN[id]}</Text></TouchableOpacity>)}</View></View>
    <View style={styles.section}><Text style={styles.sectionTitle}>{tx('language')}</Text><TouchableOpacity style={styles.selectField} onPress={() => setLanguageOpen(true)}><Text style={styles.selectText}>{LANGUAGES.find(([code]) => code === lang)?.[1] || 'English'}</Text><Text style={styles.selectText}>⌄</Text></TouchableOpacity></View>
    <View style={styles.section}><View style={styles.switchRow}><View style={{ flex: 1 }}><Text style={styles.sectionTitle}>{tx('notifications')}</Text><Text style={styles.bodyText}>{local.notificationsInfo}</Text></View><Switch value={settings.notifications} onValueChange={(notifications) => setSettings((value) => ({ ...value, notifications }))} trackColor={{ false: palette.border, true: palette.primary }}/></View><TouchableOpacity style={styles.outlineButton} onPress={() => Linking.openSettings()}><Text style={styles.outlineText}>{local.openNotificationSettings}</Text></TouchableOpacity></View>
    <TouchableOpacity style={styles.primary} onPress={() => Linking.openURL('https://play.google.com/store/apps/details?id=com.tirka.snack194d31ffd8be41a68d68f8ac0064d5ac')}><Text style={styles.primaryText}>{local.review}</Text></TouchableOpacity>
    {settings.developer ? <View style={styles.section}><Text style={styles.sectionTitle}>{local.developerMode}</Text><Text style={styles.bodyText}>{local.developerSaved}</Text><TouchableOpacity style={styles.danger} onPress={() => setSettings((value) => ({ ...value, developer: false }))}><Text style={styles.primaryText}>{local.exitDeveloper}</Text></TouchableOpacity></View> : null}
    </ScrollView>
    <Modal visible={languageOpen} transparent animationType="fade" onRequestClose={() => setLanguageOpen(false)}><View style={styles.modalShade}><View style={styles.languageModal}><Text style={styles.sectionTitle}>{tx('language')}</Text><ScrollView>{LANGUAGES.map(([code, label]) => <TouchableOpacity key={code} style={[styles.languageRow, code === lang && styles.selected]} onPress={() => { setSettings((value) => ({ ...value, language: code })); setLanguageOpen(false); }}><Text style={styles.selectText}>{label}</Text>{code === lang ? <Text style={styles.selectText}>✓</Text> : null}</TouchableOpacity>)}</ScrollView><TouchableOpacity style={styles.outlineButton} onPress={() => setLanguageOpen(false)}><Text style={styles.outlineText}>{tx('cancel')}</Text></TouchableOpacity></View></View></Modal>
    <Modal visible={developerOpen} transparent animationType="fade" onRequestClose={() => setDeveloperOpen(false)}><View style={styles.modalShade}><View style={styles.codeModal}><Text style={styles.sectionTitle}>{local.developerPassword}</Text><TextInput style={styles.input} value={developerCode} onChangeText={(value) => setDeveloperCode(value.replace(/\D/g, '').slice(0, 4))} keyboardType="number-pad" secureTextEntry maxLength={4}/><TouchableOpacity style={styles.primary} onPress={unlockDeveloper}><Text style={styles.primaryText}>{local.unlock}</Text></TouchableOpacity></View></View></Modal>
  </Shell>;

  if (screen === 'book-form') return <Shell active="library"><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><Header title={editingId ? local.editBook : local.addBook}/><ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
    <Text style={styles.label}>{tx('title')}</Text><TextInput style={styles.input} value={form.title} onChangeText={(title) => setForm((value) => ({ ...value, title }))} placeholder={local.titlePlaceholder} placeholderTextColor={palette.muted}/>
    <Text style={styles.label}>{tx('total')}</Text><TextInput style={styles.input} value={form.totalPages} onChangeText={(totalPages) => setForm((value) => ({ ...value, totalPages: totalPages.replace(/\D/g, '') }))} keyboardType="number-pad" placeholder="0" placeholderTextColor={palette.muted}/>
    <Text style={styles.label}>{tx('daily')}</Text><TextInput style={styles.input} value={form.dailyNorm} onChangeText={(dailyNorm) => setForm((value) => ({ ...value, dailyNorm: dailyNorm.replace(/\D/g, '') }))} keyboardType="number-pad" placeholder="0" placeholderTextColor={palette.muted}/>
    <TouchableOpacity style={styles.primary} onPress={saveBook}><Text style={styles.primaryText}>{tx('save')}</Text></TouchableOpacity><TouchableOpacity style={styles.outlineButton} onPress={() => setScreen('library')}><Text style={styles.outlineText}>{tx('cancel')}</Text></TouchableOpacity>
    </ScrollView></KeyboardAvoidingView></Shell>;
  if (screen === 'quiz-loading') return <Shell noBottom><View style={styles.center}><Text style={styles.title}>{local.quizCreating}</Text><Text style={styles.hint}>{local.quizWait}</Text></View></Shell>;
  if (screen === 'quiz') return <Shell noBottom><View style={styles.quizBody}>{quizResult ? <View style={styles.section}><Text style={styles.title}>{quizResult.passed ? local.passed : local.failed}</Text><Text style={styles.quizScore}>{local.result}: {quizResult.score}/5</Text><TouchableOpacity style={styles.primary} onPress={() => setScreen('calendar')}><Text style={styles.primaryText}>{local.backToLibrary}</Text></TouchableOpacity>{!quizResult.passed ? <TouchableOpacity style={styles.outlineButton} onPress={startQuiz}><Text style={styles.outlineText}>{local.retry}</Text></TouchableOpacity> : null}</View> : <><Text style={styles.brand}>{local.question} {quizIndex + 1} {local.of} 5 · {quizSeconds}s</Text><View style={styles.section}><Text style={styles.quizPrompt}>{quiz[quizIndex]?.prompt}</Text>{quiz[quizIndex]?.options.map((option, index) => <TouchableOpacity key={`${option}-${index}`} style={[styles.answer, quizAnswer === index && styles.selected, settings.developer && quizAnswer !== null && index === quiz[quizIndex].correctIndex && styles.correctAnswer]} onPress={() => setQuizAnswer(index)}><Text style={styles.bodyText}>{String.fromCharCode(65 + index)}. {option}</Text></TouchableOpacity>)}</View>{settings.developer ? <TouchableOpacity style={styles.outlineButton} onPress={() => setQuizAnswer(quiz[quizIndex].correctIndex)}><Text style={styles.outlineText}>{local.hint}</Text></TouchableOpacity> : null}<TouchableOpacity style={[styles.primary, quizAnswer === null && styles.disabled]} disabled={quizAnswer === null} onPress={() => submitQuizAnswer(false)}><Text style={styles.primaryText}>{quizIndex === 4 ? local.finish : local.next}</Text></TouchableOpacity></>}</View></Shell>;

  if (screen === 'calendar' && activeBook) { const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(days[0]); return <Shell active="library">
    <View style={styles.calendarTop}><TouchableOpacity style={styles.arrow} onPress={() => moveWeek(-1)}><Text style={styles.arrowText}>‹</Text></TouchableOpacity><TouchableOpacity onPress={() => { const now = new Date(); setWeekStart(startOfWeek(now)); setSelectedDay((now.getDay() + 6) % 7); }}><Text style={styles.month}>{monthLabel}</Text><Text style={styles.today}>{local.todayHint}</Text></TouchableOpacity><TouchableOpacity style={styles.arrow} onPress={() => moveWeek(1)}><Text style={styles.arrowText}>›</Text></TouchableOpacity></View>
    <View style={styles.days}>{days.map((day, index) => <TouchableOpacity key={dateKey(day)} style={[styles.day, selectedDay === index && styles.selected, dateKey(day) === todayKey && styles.todayDay]} onPress={() => setSelectedDay(index)}><Text style={styles.dayName}>{new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(day)}</Text><Text style={styles.dayNumber}>{day.getDate()}</Text>{activeBook.progress?.[dateKey(day)] > 0 ? <View style={styles.dot}/> : null}</TouchableOpacity>)}</View>
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}><View style={styles.section}><Text style={styles.bookTitle}>{activeBook.title}</Text><Text style={styles.bodyText}>{tr('calendarSub', left, activeBook.dailyNorm)}</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, readTotal / activeBook.totalPages * 100)}%` }]}/></View><Text style={styles.label}>{future ? local.selectedFuture : local.pagesQuestion}</Text><TextInput style={[styles.counter, future && styles.disabled]} value={selectedValue ? String(selectedValue) : ''} onChangeText={updatePages} editable={!future} keyboardType="number-pad" placeholder="0" placeholderTextColor={palette.muted}/>{completed ? <View style={styles.completed}><Text style={styles.completedText}>{local.bookCompleted}</Text>{!activeBook.quizPassed ? <TouchableOpacity style={styles.primary} onPress={startQuiz}><Text style={styles.primaryText}>{tx('takeQuiz')}</Text></TouchableOpacity> : <Text style={styles.completedText}>✓ {local.passed}</Text>}</View> : null}</View><TouchableOpacity style={styles.outlineButton} onPress={() => setScreen('library')}><Text style={styles.outlineText}>{local.backToLibrary}</Text></TouchableOpacity></ScrollView>
  </Shell>; }
  return <Shell active="library"><Header title={tx('library')}/><ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>{books.length === 0 ? <View style={styles.section}><Text style={styles.sectionTitle}>{tx('noBooks')}</Text><Text style={styles.bodyText}>{tx('noBooksText')}</Text></View> : books.map((book) => { const read = Object.values(book.progress || {}).reduce((sum, value) => sum + (Number(value) || 0), 0); const remaining = Math.max(0, book.totalPages - read); return <TouchableOpacity key={book.id} style={styles.bookCard} onPress={() => openBook(book)}><View style={{ flex: 1 }}><Text style={styles.bookTitle}>{book.title}</Text><Text style={styles.bodyText}>{remaining === 0 ? local.bookCompleted : tr('leftOfTotal', remaining, book.totalPages)}</Text><View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${Math.min(100, read / book.totalPages * 100)}%` }]}/></View></View><TouchableOpacity style={styles.small} onPress={() => editBook(book)}><Text style={styles.smallText}>✎</Text></TouchableOpacity><TouchableOpacity style={styles.small} onPress={() => removeBook(book)}><Text style={styles.smallText}>×</Text></TouchableOpacity></TouchableOpacity>; })}</ScrollView><TouchableOpacity style={styles.primary} onPress={() => { setEditingId(null); setForm({ title: '', totalPages: '', dailyNorm: '' }); setScreen('book-form'); }}><Text style={styles.primaryText}>{local.addBook}</Text></TouchableOpacity></Shell>;
}

const makeStyles = (c, rtl) => StyleSheet.create({
  root: { flex: 1, backgroundColor: c.bg }, body: { flex: 1, paddingHorizontal: 18, paddingTop: 8 }, accentBig: { position: 'absolute', width: width * 0.8, height: width * 0.8, borderRadius: width, right: -width * 0.25, top: -width * 0.2, backgroundColor: c.accent, opacity: 0.8 }, accentSmall: { position: 'absolute', width: width * 0.42, height: width * 0.42, borderRadius: width, left: -width * 0.18, bottom: 90, backgroundColor: c.accent, opacity: 0.35 },
  header: { paddingTop: 10, paddingBottom: 14 }, brand: { color: c.primary, fontSize: 15, fontWeight: '900', letterSpacing: 1, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }, title: { color: c.text, fontSize: 38, lineHeight: 46, fontWeight: '900', marginTop: 10, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }, hint: { color: c.muted, fontSize: 16, lineHeight: 24, marginTop: 8, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' },
  scroll: { flex: 1 }, scrollContent: { paddingBottom: 18 }, section: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 16, marginBottom: 14 }, sectionTitle: { color: c.text, fontSize: 22, fontWeight: '900', marginBottom: 14, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }, bodyText: { color: c.muted, fontSize: 16, lineHeight: 23, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }, row: { flexDirection: rtl ? 'row-reverse' : 'row', gap: 10 },
  halfButton: { flex: 1, minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center', backgroundColor: c.input }, selected: { backgroundColor: c.primary, borderColor: c.primary }, buttonText: { color: c.text, fontSize: 16, fontWeight: '900' },
  switchRow: { flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 12 },
  backgroundGrid: { flexDirection: rtl ? 'row-reverse' : 'row', flexWrap: 'wrap', justifyContent: 'space-between' }, backgroundChoice: { width: '31.5%', borderWidth: 1, borderColor: c.border, borderRadius: 12, padding: 7, marginBottom: 10, alignItems: 'center' }, backgroundPreview: { width: '100%', height: 46, borderRadius: 9, overflow: 'hidden' }, previewCircle: { width: 52, height: 52, borderRadius: 26, position: 'absolute', right: -8, top: -16, opacity: 0.9 }, backgroundLabel: { color: c.text, fontSize: 12, fontWeight: '800', marginTop: 7, textAlign: 'center' },
  selectField: { minHeight: 54, borderWidth: 1, borderColor: c.border, borderRadius: 12, backgroundColor: c.input, paddingHorizontal: 14, flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }, selectText: { color: c.text, fontSize: 17, fontWeight: '800', writingDirection: rtl ? 'rtl' : 'ltr' }, languageRow: { minHeight: 50, paddingHorizontal: 12, marginBottom: 7, borderWidth: 1, borderColor: c.border, borderRadius: 10, flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalShade: { flex: 1, backgroundColor: '#0009', justifyContent: 'center', padding: 22 }, languageModal: { maxHeight: '82%', backgroundColor: c.card, borderRadius: 16, padding: 16 }, codeModal: { backgroundColor: c.card, borderRadius: 16, padding: 18 },
  label: { color: c.text, fontSize: 16, fontWeight: '800', marginBottom: 8, marginTop: 8, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }, input: { minHeight: 56, borderWidth: 1, borderColor: c.border, borderRadius: 12, backgroundColor: c.input, color: c.text, fontSize: 17, paddingHorizontal: 14, marginBottom: 12, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' },
  primary: { minHeight: 56, borderRadius: 13, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, marginBottom: 12 }, primaryText: { color: '#21150a', fontSize: 17, fontWeight: '900', textAlign: 'center' }, outlineButton: { minHeight: 52, borderRadius: 12, borderWidth: 1, borderColor: c.primary, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, marginTop: 8, marginBottom: 8 }, outlineText: { color: c.primary, fontSize: 16, fontWeight: '900', textAlign: 'center' }, danger: { minHeight: 52, borderRadius: 12, backgroundColor: '#b94d4d', alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  bottom: { flexDirection: rtl ? 'row-reverse' : 'row', gap: 10, paddingHorizontal: 16, paddingTop: 9, paddingBottom: Platform.OS === 'ios' ? 8 : 12, backgroundColor: c.tab, borderTopWidth: 1, borderTopColor: c.border }, tab: { flex: 1, minHeight: 58, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border }, activeTab: { backgroundColor: c.primary, borderColor: c.primary }, tabIcon: { color: c.text, fontSize: 18 }, tabText: { color: c.muted, fontSize: 13, fontWeight: '800' }, activeTabText: { color: '#21150a' },
  bookCard: { backgroundColor: c.card, borderWidth: 1, borderColor: c.border, borderRadius: 14, padding: 16, marginBottom: 12, flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }, bookTitle: { color: c.text, fontSize: 24, fontWeight: '900', marginBottom: 7, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }, small: { width: 38, height: 38, borderWidth: 1, borderColor: c.border, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }, smallText: { color: c.primary, fontSize: 23, fontWeight: '900' }, progressTrack: { height: 8, borderRadius: 6, backgroundColor: c.border, overflow: 'hidden', marginTop: 12 }, progressFill: { height: '100%', backgroundColor: c.success },
  calendarTop: { flexDirection: rtl ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 }, arrow: { width: 46, height: 46, borderRadius: 12, backgroundColor: c.card, borderWidth: 1, borderColor: c.border, alignItems: 'center', justifyContent: 'center' }, arrowText: { color: c.primary, fontSize: 34 }, month: { color: c.text, fontWeight: '900', fontSize: 20, textAlign: 'center' }, today: { color: c.muted, fontSize: 13, textAlign: 'center' }, days: { flexDirection: rtl ? 'row-reverse' : 'row', gap: 5, paddingVertical: 12 }, day: { flex: 1, minHeight: 67, borderRadius: 12, borderWidth: 1, borderColor: c.border, backgroundColor: c.card, alignItems: 'center', justifyContent: 'center' }, todayDay: { borderColor: c.success, borderWidth: 2 }, dayName: { color: c.muted, fontSize: 11, fontWeight: '800' }, dayNumber: { color: c.text, fontSize: 20, fontWeight: '900' }, dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: c.success, position: 'absolute', bottom: 5 }, counter: { minHeight: 125, borderRadius: 14, borderWidth: 1, borderColor: c.border, backgroundColor: c.input, color: c.text, fontSize: 64, fontWeight: '900', textAlign: 'center', marginTop: 6 }, disabled: { opacity: 0.45 }, completed: { marginTop: 14, borderWidth: 1, borderColor: c.success, borderRadius: 12, padding: 12 }, completedText: { color: c.success, textAlign: 'center', fontSize: 18, fontWeight: '900', marginBottom: 8 },
  center: { flex: 1, justifyContent: 'center', padding: 12 }, quizBody: { flex: 1, justifyContent: 'center', paddingVertical: 16 }, quizPrompt: { color: c.text, fontSize: 21, lineHeight: 29, fontWeight: '900', marginBottom: 14, textAlign: rtl ? 'right' : 'left', writingDirection: rtl ? 'rtl' : 'ltr' }, answer: { minHeight: 52, borderWidth: 1, borderColor: c.border, borderRadius: 11, padding: 12, justifyContent: 'center', marginBottom: 8 }, correctAnswer: { borderColor: c.success, borderWidth: 3 }, quizScore: { color: c.text, fontSize: 28, fontWeight: '900', marginVertical: 18 },
});
