import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'BOOK_TRACKER_ANDROID_FIXED';

const months = [
  'ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ',
  'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ',
];

const daysOfWeek = ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'];

const formatDateKey = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Получить дату начала недели для любой даты
const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
};

export default function App() {
  const [screen, setScreen] = useState('library');
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [bookTitle, setBookTitle] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [dailyNorm, setDailyNorm] = useState('');
  const [editingBookId, setEditingBookId] = useState(null);
  
  // Храним НАЧАЛО текущей недели (понедельник)
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);
  const [inputValue, setInputValue] = useState('');
  
  const timeoutRef = useRef(null);

  useEffect(() => {
    loadBooks();
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const loadBooks = async () => {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setBooks(parsed);
        if (parsed.length > 0) setSelectedBookId(parsed[0].id);
      }
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось загрузить книги');
    }
  };

  const saveBooks = async (updatedBooks) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBooks));
      setBooks(updatedBooks);
    } catch (e) {
      Alert.alert('Ошибка', 'Не удалось сохранить');
    }
  };

  const resetForm = () => {
    setBookTitle('');
    setTotalPages('');
    setDailyNorm('');
    setEditingBookId(null);
  };

  const activeBook = useMemo(() => books.find(b => b.id === selectedBookId), [books, selectedBookId]);

  // Получить 7 дней текущей недели
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      return d;
    });
  }, [currentWeekStart]);

  const selectedDateObject = weekDays[selectedDayOffset];
  const selectedDateKey = formatDateKey(selectedDateObject);
  const todayKey = formatDateKey(new Date());
  const isFuture = selectedDateKey > todayKey;

  const currentProgressValue = activeBook?.progress?.[selectedDateKey] || 0;

  useEffect(() => {
    setInputValue(currentProgressValue === 0 ? '' : currentProgressValue.toString());
  }, [selectedDateKey, selectedBookId]);

  const totalReadPages = useMemo(() => {
    if (!activeBook) return 0;
    return Object.values(activeBook.progress || {}).reduce((sum, value) => sum + (parseInt(value, 10) || 0), 0);
  }, [activeBook]);

  const leftPages = activeBook ? Math.max(0, activeBook.totalPages - totalReadPages) : 0;
  const isBookFinished = activeBook && leftPages === 0;

  const hasProgressOnDay = (dateObj) => {
    if (!activeBook) return false;
    const val = activeBook.progress?.[formatDateKey(dateObj)];
    return val && val > 0;
  };

  const handleUpdateProgress = (text) => {
    if (isFuture || !activeBook) return;

    const clean = text.replace(/[^0-9]/g, '');
    let entered = parseInt(clean, 10) || 0;

    let readWithoutToday = 0;
    Object.keys(activeBook.progress || {}).forEach(key => {
      if (key !== selectedDateKey) readWithoutToday += parseInt(activeBook.progress[key], 10) || 0;
    });

    const maxAvailable = activeBook.totalPages - readWithoutToday;
    if (entered > maxAvailable) entered = maxAvailable;

    const updated = books.map(b => {
      if (b.id === selectedBookId) {
        return {
          ...b,
          progress: { ...(b.progress || {}), [selectedDateKey]: entered },
        };
      }
      return b;
    });

    setBooks(updated);
    setInputValue(entered === 0 ? '' : entered.toString());

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => saveBooks(updated), 500);
  };

  const handleSaveBook = () => {
    if (!bookTitle.trim() || !totalPages.trim() || !dailyNorm.trim()) {
      return Alert.alert('Ошибка', 'Заполните все поля');
    }
    const total = parseInt(totalPages, 10);
    let norm = parseInt(dailyNorm, 10);
    if (isNaN(total) || isNaN(norm)) return Alert.alert('Ошибка', 'Введите числа');
    if (norm > total) norm = total;

    if (screen === 'new_book') {
      const newBook = {
        id: Date.now().toString(),
        title: bookTitle,
        totalPages: total,
        dailyNorm: norm,
        progress: {},
      };
      const updated = [...books, newBook];
      saveBooks(updated);
      setSelectedBookId(newBook.id);
    }
    if (screen === 'edit_book') {
      const updated = books.map(b => {
        if (b.id === editingBookId) {
          return { ...b, title: bookTitle, totalPages: total, dailyNorm: norm };
        }
        return b;
      });
      saveBooks(updated);
    }
    resetForm();
    setScreen('library');
  };

  const handleDeleteBook = (id) => {
    Alert.alert('Удаление', 'Удалить книгу?', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить',
        style: 'destructive',
        onPress: () => {
          const updated = books.filter(b => b.id !== id);
          saveBooks(updated);
          if (updated.length > 0) setSelectedBookId(updated[0].id);
          else setSelectedBookId(null);
        },
      },
    ]);
  };

  const openEditBook = (book) => {
    setEditingBookId(book.id);
    setBookTitle(book.title);
    setTotalPages(book.totalPages.toString());
    setDailyNorm(book.dailyNorm.toString());
    setScreen('edit_book');
  };

  // Переключение НА НЕДЕЛЮ НАЗАД (на 7 дней)
  const goPrevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
    setSelectedDayOffset(0);
  };

  // Переключение НА НЕДЕЛЮ ВПЕРЁД (на 7 дней)
  const goNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
    setSelectedDayOffset(0);
  };

  // Переключение на сегодняшнюю неделю
  const goToToday = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
    setSelectedDayOffset(0);
  };

  // Месяц и год для отображения (берём из первого дня недели)
  const displayMonth = weekDays[0]?.getMonth() || 0;
  const displayYear = weekDays[0]?.getFullYear() || 2026;

  return (
    <View style={styles.container}>
      {screen === 'library' && (
        <View style={styles.innerWrapper}>
          <Text style={styles.screenTitle}>БИБЛИОТЕКА</Text>
          <ScrollView style={styles.scrollList}>
            {books.map(item => {
              const itemRead = Object.values(item.progress || {}).reduce((a,b)=> (parseInt(a,10)||0)+(parseInt(b,10)||0),0);
              const itemLeft = Math.max(0, item.totalPages - itemRead);
              const progressPercent = item.totalPages ? ((item.totalPages - itemLeft) / item.totalPages) * 100 : 0;
              return (
                <TouchableOpacity key={item.id} style={styles.bookCard} onPress={() => {
                  setSelectedBookId(item.id);
                  setCurrentWeekStart(getStartOfWeek(new Date()));
                  setSelectedDayOffset(0);
                  setScreen('calendar');
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookCardTitle}>{item.title}</Text>
                    {itemLeft === 0 ? (
                      <Text style={styles.bookCardFinishedText}>Прочитано 🎉</Text>
                    ) : (
                      <>
                        <Text style={styles.bookCardSub}>Осталось: {itemLeft} стр</Text>
                        <View style={styles.progressBarContainer}>
                          <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
                        </View>
                      </>
                    )}
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => openEditBook(item)}>
                      <Text style={{ fontSize: 18 }}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteBook(item.id)}>
                      <Text style={{ fontSize: 18 }}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
          <TouchableOpacity style={styles.dashedButton} onPress={() => setScreen('new_book')}>
            <Text style={styles.dashedButtonText}>+ НОВАЯ КНИГА</Text>
          </TouchableOpacity>
        </View>
      )}

      {(screen === 'new_book' || screen === 'edit_book') && (
        <View style={styles.innerWrapper}>
          <Text style={styles.screenTitle}>{screen === 'new_book' ? 'НОВАЯ КНИГА' : 'ИЗМЕНИТЬ'}</Text>
          <View style={styles.formContainer}>
            <View style={styles.inputBlock}>
              <Text style={styles.inputPlaceholder}>Название</Text>
              <TextInput style={styles.borderInput} value={bookTitle} onChangeText={setBookTitle} />
            </View>
            <View style={styles.inputBlock}>
              <Text style={styles.inputPlaceholder}>Всего страниц</Text>
              <TextInput style={styles.borderInput} keyboardType="numeric" value={totalPages} onChangeText={text => setTotalPages(text.replace(/[^0-9]/g, ''))} />
            </View>
            <View style={styles.inputBlock}>
              <Text style={styles.inputPlaceholder}>Норма в день</Text>
              <TextInput style={styles.borderInput} keyboardType="numeric" value={dailyNorm} onChangeText={text => setDailyNorm(text.replace(/[^0-9]/g, ''))} />
            </View>
            <TouchableOpacity style={styles.orangeSolidButton} onPress={handleSaveBook}>
              <Text style={styles.orangeSolidButtonText}>СОХРАНИТЬ</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelLink} onPress={() => { resetForm(); setScreen('library'); }}>
              <Text style={styles.cancelLinkText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {screen === 'calendar' && (
        <View style={styles.innerWrapper}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={goPrevWeek}><Text style={styles.arrow}>◀</Text></TouchableOpacity>
            <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
              <Text style={styles.monthText}>{months[displayMonth]} {displayYear}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={goNextWeek}><Text style={styles.arrow}>▶</Text></TouchableOpacity>
          </View>
          <View style={styles.weekContainer}>
            {weekDays.map((day, idx) => {
              const isToday = formatDateKey(day) === todayKey;
              const isSelected = selectedDayOffset === idx;
              return (
                <TouchableOpacity key={idx} style={[styles.dayCircle, isToday && styles.todayGreenCircle, isSelected && styles.selectedDayCircle]} onPress={() => setSelectedDayOffset(idx)}>
                  <Text style={styles.dayWeekText}>{daysOfWeek[day.getDay()]}</Text>
                  <Text style={styles.dayNumText}>{day.getDate()}</Text>
                  {hasProgressOnDay(day) && <View style={styles.progressDot} />}
                  {isSelected && <View style={styles.underLine} />}
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.calendarBookTitle}>{activeBook?.title || 'Без книги'}</Text>
          <Text style={styles.calendarBookSub}>Осталось: {leftPages} стр | Норма: {activeBook?.dailyNorm || 0} стр</Text>
          <Text style={styles.statusMessage}>{isFuture ? 'ПИСАТЬ В БУДУЩЕЕ НЕЛЬЗЯ' : 'СКОЛЬКО ПРОЧИТАЛ СЕГОДНЯ?'}</Text>
          <View style={styles.counterContainer}>
            <TextInput 
              style={[styles.bigCounterInput, isFuture && { color: '#999' }]} 
              keyboardType="number-pad" 
              value={inputValue} 
              onChangeText={handleUpdateProgress} 
              placeholder="0" 
              placeholderTextColor="#555" 
              editable={!isFuture} 
            />
            {isBookFinished && (
              <View style={styles.congratsBlock}>
                <Text style={{ fontSize: 44, marginBottom: 5 }}>🎉</Text>
                <Text style={styles.congratsText}>Поздравляю! Книга прочитана!</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.darkButton} onPress={() => setScreen('library')}>
            <Text style={styles.darkButtonText}>НАЗАД В БИБЛИОТЕКУ</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', paddingHorizontal: 25, paddingTop: 50 },
  innerWrapper: { width: '100%', flex: 1, alignItems: 'center' },
  screenTitle: { fontSize: 28, fontWeight: 'bold', color: '#000', textAlign: 'center', marginTop: 20, marginBottom: 30 },
  scrollList: { width: '100%', flex: 1, marginBottom: 15 },
  bookCard: { backgroundColor: '#f7f7f7', padding: 18, borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, width: '100%' },
  bookCardTitle: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  bookCardSub: { fontSize: 14, color: '#8e8e93' },
  bookCardFinishedText: { fontSize: 14, color: '#28a745', fontWeight: 'bold' },
  cardActions: { flexDirection: 'row', gap: 12 },
  iconBtn: { padding: 4 },
  dashedButton: { width: '100%', borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#ff9f00', borderRadius: 18, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 65 },
  dashedButtonText: { color: '#ff9f00', fontSize: 16, fontWeight: 'bold' },
  formContainer: { width: '100%', alignItems: 'center', marginTop: 10 },
  inputBlock: { width: '100%', marginBottom: 20 },
  inputPlaceholder: { fontSize: 16, color: '#000', marginBottom: 2, paddingLeft: 2 },
  borderInput: { width: '100%', borderBottomWidth: 1.5, borderBottomColor: '#ff9f00', fontSize: 18, paddingVertical: 4, color: '#000' },
  orangeSolidButton: { backgroundColor: '#ff9f00', width: '100%', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 20 },
  orangeSolidButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  cancelLink: { marginTop: 22, padding: 5 },
  cancelLinkText: { color: '#8e8e93', fontSize: 15 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20, marginVertical: 20, width: '100%' },
  arrow: { fontSize: 18, color: '#ff9f00', paddingHorizontal: 10 },
  monthText: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  todayButton: { paddingHorizontal: 5 },
  weekContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 25 },
  dayCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f2f7' },
  todayGreenCircle: { borderWidth: 2.5, borderColor: '#006400', backgroundColor: '#fff' },
  selectedDayCircle: { backgroundColor: '#fff3e0', borderWidth: 1.5, borderColor: '#ff9f00' },
  dayWeekText: { fontSize: 10, color: '#3a3a3c', fontWeight: '500' },
  dayNumText: { fontSize: 14, color: '#3a3a3c', fontWeight: '600', marginTop: 1 },
  underLine: { width: 16, height: 3.5, backgroundColor: '#000', position: 'absolute', bottom: -12, borderRadius: 2 },
  progressDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#28a745', position: 'absolute', bottom: 5, left: '50%', marginLeft: -3 },
  calendarBookTitle: { fontSize: 32, fontWeight: 'bold', color: '#000', marginTop: 15, marginBottom: 12 },
  calendarBookSub: { fontSize: 16, color: '#000', marginBottom: 25 },
  statusMessage: { fontSize: 15, color: '#8e8e93', marginBottom: 15 },
  counterContainer: { flex: 1, justifyContent: 'flex-start', paddingTop: 10, alignItems: 'center', width: '100%' },
  bigCounterInput: { width: '100%', minHeight: 120, fontSize: 72, fontWeight: '600', color: '#000', textAlign: 'center', paddingVertical: 10, paddingHorizontal: 20, includeFontPadding: false, textAlignVertical: 'center' },
  congratsBlock: { alignItems: 'center', marginTop: 0, marginBottom: 10 },
  congratsText: { fontSize: 18, fontWeight: 'bold', color: '#000', textAlign: 'center' },
  darkButton: { backgroundColor: '#2c2c2e', width: '100%', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 65, alignSelf: 'center' },
  darkButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  progressBarContainer: { height: 6, backgroundColor: '#e0e0e0', borderRadius: 3, marginTop: 8, width: '100%', overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#ff9f00', borderRadius: 3 },
});
