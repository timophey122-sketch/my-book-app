import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, ScrollView, Alert, Keyboard } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const formatDateKey = (dateObj) => {
  if (!dateObj) return '';
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function App() {
  const [screen, setScreen] = useState('library'); 
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(null);

  const [bookTitle, setBookTitle] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [dailyNorm, setDailyNorm] = useState('');
  const [editingBookId, setEditingBookId] = useState(null);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayOffset, setSelectedDayOffset] = useState(2); // СР по умолчанию

  useEffect(() => {
    const loadData = async () => {
      try {
        const saved = await AsyncStorage.getItem('my_tracker_apk_keyboard_perfect');
        if (saved) {
          const parsed = JSON.parse(saved);
          setBooks(parsed);
          if (parsed.length > 0) setSelectedBookId(parsed.id);
        }
      } catch (e) {
        Alert.alert("Ошибка", "Не удалось загрузить данные");
      }
    };
    loadData();
  }, []);

  const saveBooks = async (updatedBooks) => {
    setBooks(updatedBooks);
    await AsyncStorage.setItem('my_tracker_apk_keyboard_perfect', JSON.stringify(updatedBooks));
  };

  const handleSaveBook = () => {
    if (!bookTitle.trim() || !totalPages.trim() || !dailyNorm.trim()) {
      return Alert.alert("Ошибка", "Заполните все поля!");
    }
    const total = parseInt(totalPages, 10);
    let norm = parseInt(dailyNorm, 10);
    
    if (isNaN(total) || isNaN(norm)) return Alert.alert("Ошибка", "Введите числа!");

    if (norm > total) {
      norm = total;
      Alert.alert("Внимание", `Норма не может превышать страницы! Установлено: ${total} стр.`);
    }

    if (screen === 'new_book') {
      const newBook = {
        id: Date.now().toString(),
        title: bookTitle,
        totalPages: total,
        dailyNorm: norm,
        progress: {} 
      };
      const updated = [...books, newBook];
      saveBooks(updated);
      setSelectedBookId(newBook.id);
    } else if (screen === 'edit_book') {
      const updated = books.map(b => b.id === editingBookId ? { ...b, title: bookTitle, totalPages: total, dailyNorm: norm } : b);
      saveBooks(updated);
    }

    setBookTitle(''); setTotalPages(''); setDailyNorm('');
    setScreen('library');
  };

  const handleDeleteBook = (id) => {
    Alert.alert("Удаление", "Точно уверены, что хотите удалить книгу?", [
      { text: "Отмена", style: "cancel" },
      { 
        text: "Удалить", 
        style: "destructive", 
        onPress: () => {
          const updated = books.filter(b => b.id !== id);
          saveBooks(updated);
          if (selectedBookId === id) setSelectedBookId(updated.length > 0 ? updated.id : null);
        }
      }
    ]);
  };

  const openEditBook = (book) => {
    setEditingBookId(book.id);
    setBookTitle(book.title);
    setTotalPages(book.totalPages.toString());
    setDailyNorm(book.dailyNorm.toString());
    setScreen('edit_book');
  };

  const months = ["ЯНВАРЬ", "ФЕВРАЛЬ", "МАРТ", "АПРЕЛЬ", "МАЙ", "ИЮНЬ", "ИЮЛЬ", "АВГУСТ", "СЕНТЯБРЬ", "ОКТЯБРЬ", "НОЯБРЬ", "ДЕКАБРЬ"];
  const daysOfWeek = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); 
    startOfWeek.setDate(diff);

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  };

  const changeMonth = (direction) => {
    const nextMonth = new Date(currentDate);
    nextMonth.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(nextMonth);
  };

  const activeBook = books.find(b => b.id === selectedBookId);
  const weekDays = getWeekDays();
  const selectedDateObject = weekDays[selectedDayOffset]; 
  const selectedDateKey = formatDateKey(selectedDateObject);
  const todayKey = formatDateKey(new Date());

  const isFuture = selectedDateKey > todayKey;
  const currentProgressValue = (activeBook?.progress && activeBook.progress[selectedDateKey]) !== undefined 
    ? activeBook.progress[selectedDateKey] 
    : 0;

  let totalReadPages = 0;
  if (activeBook && activeBook.progress) {
    Object.values(activeBook.progress).forEach(val => {
      totalReadPages += (parseInt(val, 10) || 0);
    });
  }

  const leftPages = activeBook ? Math.max(0, activeBook.totalPages - totalReadPages) : 0;
  const isBookFinished = activeBook && leftPages === 0;

  const handleUpdateProgress = (val) => {
    if (isFuture || !activeBook) return;
    
    const cleanVal = val.replace(/[^0-9]/g, ''); 
    const pagesEntered = parseInt(cleanVal, 10) || 0;

    let readExceptToday = 0;
    Object.keys(activeBook.progress || {}).forEach(key => {
      if (key !== selectedDateKey) {
        readExceptToday += (parseInt(activeBook.progress[key], 10) || 0);
      }
    });

    let finalPages = pagesEntered;
    if (readExceptToday + finalPages > activeBook.totalPages) {
      finalPages = activeBook.totalPages - readExceptToday;
    }

    const updated = books.map(b => {
      if (b.id === selectedBookId) {
        const newProgress = { ...(b.progress || {}), [selectedDateKey]: finalPages };
        return { ...b, progress: newProgress };
      }
      return b;
    });
    
    saveBooks(updated);
  };

  return (
    <View style={styles.container}>
      {screen === 'library' && (
        <View style={styles.innerWrapper}>
          <Text style={styles.screenTitle}>БИБЛИОТЕКА</Text>
          <ScrollView style={styles.scrollList} keyboardShouldPersistTaps="always">
            {books.map(item => {
              const itemRead = Object.values(item.progress || {}).reduce((a, b) => (parseInt(a,10)||0) + (parseInt(b,10)||0), 0);
              const itemLeft = Math.max(0, item.totalPages - itemRead);
              return (
                <TouchableOpacity key={item.id} style={styles.bookCard} onPress={() => { setSelectedBookId(item.id); setScreen('calendar'); }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookCardTitle}>{item.title}</Text>
                    {itemLeft === 0 ? <Text style={styles.bookCardFinishedText}>Прочитано! Ура!</Text> : <Text style={styles.bookCardSub}>Осталось: {itemLeft} стр</Text>}
                  </View>
                  <View style={styles.cardActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => openEditBook(item)}><Text style={{fontSize: 18}}>✏️</Text></TouchableOpacity>
                    <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteBook(item.id)}><Text style={{fontSize: 18}}>🗑️</Text></TouchableOpacity>
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
            <View style={styles.inputBlock}><Text style={styles.inputPlaceholder}>Название</Text><TextInput style={styles.borderInput} value={bookTitle} onChangeText={setBookTitle} underlineColorAndroid="transparent" /></View>
            <View style={styles.inputBlock}><Text style={styles.inputPlaceholder}>Всего страниц</Text><TextInput style={styles.borderInput} keyboardType="numeric" value={totalPages} onChangeText={(text) => setTotalPages(text.replace(/[^0-9]/g, ''))} underlineColorAndroid="transparent" /></View>
            <View style={styles.inputBlock}><Text style={styles.inputPlaceholder}>Норма в день</Text><TextInput style={styles.borderInput} keyboardType="numeric" value={dailyNorm} onChangeText={(text) => setDailyNorm(text.replace(/[^0-9]/g, ''))} underlineColorAndroid="transparent" /></View>
            <TouchableOpacity style={styles.orangeSolidButton} onPress={handleSaveBook}><Text style={styles.orangeSolidButtonText}>СОХРАНИТЬ</Text></TouchableOpacity>
            <TouchableOpacity style={styles.cancelLink} onPress={() => { setBookTitle(''); setTotalPages(''); setDailyNorm(''); setScreen('library'); }}><Text style={styles.cancelLinkText}>Отмена</Text></TouchableOpacity>
          </View>
        </View>
      )}

      {screen === 'calendar' && (
        <View style={styles.innerWrapper}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={() => changeMonth(-1)}><Text style={styles.arrow}>◀</Text></TouchableOpacity>
            <Text style={styles.monthText}>{months[currentDate.getMonth()]} {currentDate.getFullYear()}</Text>
            <TouchableOpacity onPress={() => changeMonth(1)}><Text style={styles.arrow}>▶</Text></TouchableOpacity>
          </View>

          <View style={styles.weekContainer}>
            {weekDays.map((day, idx) => {
              const isSelected = selectedDayOffset === idx;
              const isActualToday = formatDateKey(day) === todayKey; 
              return (
                <TouchableOpacity key={idx} style={[styles.dayCircle, isActualToday && styles.todayGreenCircle]} onPress={() => setSelectedDayOffset(idx)}>
                  <Text style={styles.dayWeekText}>{daysOfWeek[day.getDay()]}</Text>
                  <Text style={styles.dayNumText}>{day.getDate()}</Text>
                  {isSelected && <View style={styles.underLine} />}
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.calendarBookTitle}>{activeBook?.title || 'Без названия'}</Text>
          <Text style={styles.calendarBookSub}>Осталось: {leftPages} стр | Норма: {activeBook?.dailyNorm || 0} стр</Text>
          <Text style={styles.statusMessage}>{isFuture ? 'ПИСАТЬ НАПЕРЁД НЕЛЬЗЯ!' : 'СКОЛЬКО ПРОЧИТАЛ СЕГОДНЯ?'}</Text>

          <View style={styles.counterContainer}>
            {/* ТЕПЕРЬ ИНПУТ НА ЭКРАНЕ ВСЕГДА. ОН НЕ ПЕРЕСОЗДАЕТСЯ, И КЛАВИАТУРА НЕ ВЫЛЕТАЕТ */}
            <TextInput 
              style={[styles.bigCounterInput, isFuture && { color: '#999' }]} 
              keyboardType="numeric"
              value={currentProgressValue === 0 ? '' : currentProgressValue.toString()}
              placeholder="0"
              placeholderTextColor="#222"
              onChangeText={handleUpdateProgress}
              underlineColorAndroid="transparent"
              editable={!isFuture} // Будущие дни блокируют ввод автоматически
              blurOnSubmit={false}
              selectTextOnFocus={true}
            />

            {isBookFinished && (
              <View style={styles.congratsBlock}>
                <Text style={{ fontSize: 44, marginBottom: 5 }}>🎉</Text>
                <Text style={styles.congratsText}>Поздравляю! Ты прочитал книгу!</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.darkButton} onPress={() => { Keyboard.dismiss(); setScreen('library'); }}><Text style={styles.darkButtonText}>НАЗАД В БИБЛИОТЕКУ</Text></TouchableOpacity>
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
  weekContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 25 },
  dayCircle: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f2f2f7' },
  todayGreenCircle: { borderWidth: 2.5, borderColor: '#006400', backgroundColor: '#fff' }, 
  dayWeekText: { fontSize: 10, color: '#3a3a3c', fontWeight: '500' },
  dayNumText: { fontSize: 14, color: '#3a3a3c', fontWeight: '600', marginTop: 1 },
  underLine: { width: 16, height: 3.5, backgroundColor: '#000', position: 'absolute', bottom: -12, borderRadius: 2 },
  calendarBookTitle: { fontSize: 32, fontWeight: 'bold', color: '#000', marginTop: 15, marginBottom: 12 },
  calendarBookSub: { fontSize: 16, color: '#000', marginBottom: 25 },
  statusMessage: { fontSize: 15, color: '#8e8e93', textTransform: 'uppercase', marginBottom: 15 },
  counterContainer: { flex: 1, justifyContent: 'flex-start', paddingTop: 10, alignItems: 'center', width: '100%' },
  bigCounterInput: { fontSize: 80, fontWeight: '500', color: '#000', textAlign: 'center', minWidth: 200, marginBottom: 5, padding: 0 },
  congratsBlock: { alignItems: 'center', marginTop: 0, marginBottom: 10 },
  congratsText: { fontSize: 18, fontWeight: 'bold', color: '#000', textAlign: 'center' },
  darkButton: { backgroundColor: '#2c2c2e', width: '100%', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 65, alignSelf: 'center' },
  darkButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
});
