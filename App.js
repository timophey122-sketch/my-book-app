import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, TouchableOpacity, SafeAreaView, TextInput, ScrollView, Alert, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from './firebaseConfig';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';

export default function App() {
  const [screen, setScreen] = useState('auth_choice'); 
  const [userEmail, setUserEmail] = useState('');
  const [userPass, setUserPass] = useState('');
  const [books, setBooks] = useState([]); 
  const [activeBookId, setActiveBookId] = useState(null);
  const [editingBookId, setEditingBookId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Восстановление пароля
  const [resetEmail, setResetEmail] = useState('');
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setStep('calendar'); // Друг уже в системе — пускаем к Титану!
      } else {
        setStep('auth'); // Никто не вошел — показываем экран входа
      }
      setIsLoading(false); // Выключаем загрузку
    });
    return unsubscribe;
  }, []);

  // Тест и модалки
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [confirmModal, setConfirmModal] = useState(false); 
  const [deleteModal, setDeleteModal] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);

  const [newTitle, setNewTitle] = useState('');
  const [newTotal, setNewTotal] = useState('');
  const [newGoal, setNewGoal] = useState('');

  const [currentWeekStart, setCurrentWeekStart] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().toDateString());
  const todayStr = new Date().toDateString();

  const testQuestions = [
    { q: "Кто был главным героем?", a: ["Автор", "Воин арбузов", "Робот", "Маг", "Пират"], correct: 1 },
    { q: "Где они находились?", a: ["На Луне", "На рынке", " В доме арбуза", "В лесу", "В океане"], correct: 2 },
    { q: "О чём был рассказ", a: ["О драконе", "О арбузе", "О еде", "О битве", "О доме"], correct: 1 },
  ];

  useEffect(() => {
    const load = async () => {         
      try {
        const savedBooks = await AsyncStorage.getItem('@books_final_v2026_pro');
        if (savedBooks) setBooks(JSON.parse(savedBooks));
      } catch (e) { console.log(e); }
      setIsLoading(false);
    };
    load();
  }, []);

  useEffect(() => {
    const save = async () => { if (!isLoading) await AsyncStorage.setItem('@books_final_v2026_pro', JSON.stringify(books)); };
    save();
  }, [books, isLoading]);

  const activeBook = books.find(b => b.id === activeBookId);

  const handleAuth = async (mode) => {
    if (!userEmail || !userPass) return Alert.alert("Ошибка", "Заполни все поля!");

    try {
      if (mode === 'reg') {
        await createUserWithEmailAndPassword(auth, userEmail, userPass);
        Alert.alert("Успех", "Аккаунт создан! Теперь нажми ВХОД.");
      } else {
        await signInWithEmailAndPassword(auth, userEmail, userPass);
      setScreen('calendar'); // Тут буква 'S' уже большая!
      }
    } catch (error) {
      Alert.alert("Ошибка сервера", error.message);
    }
  };


  const handleForgotPass = async () => {
    const saved = JSON.parse(await AsyncStorage.getItem('@user_data_secure'));
    if (saved && resetEmail === saved.email) {
      Alert.alert("Восстановление", `Ваш пароль: ${saved.pass}`);
      setScreen('login');
    } else {
      Alert.alert("Ошибка", "Пользователь не найден");
    }
  };

  const processAnswer = () => {
    setConfirmModal(false);
    let newCorrect = correctCount;
    if (selectedAnswer === testQuestions[currentQuestion].correct) newCorrect++;
    
    if (currentQuestion < 2) {
      setCurrentQuestion(currentQuestion + 1);
      setCorrectCount(newCorrect);
      setSelectedAnswer(null);
    } else {
      if (newCorrect === 3) setScreen('rewards');
      else {
        const lockout = Date.now() + 7 * 24 * 60 * 60 * 1000; 
        setBooks(books.map(b => b.id === activeBookId ? {...b, nextAttempt: lockout} : b));
        Alert.alert("ОШИБКА!", "Попробуй через 7 дней.");
        setScreen('tracker');
      }
      setCurrentQuestion(0); setSelectedAnswer(null); setCorrectCount(0);
    }
  };

  const calculateLeft = (book) => {
    if (!book) return 0;
    const read = Object.values(book.history || {}).reduce((a, b) => a + b, 0);
    const left = book.totalPages - read;
    return left > 0 ? left : 0;
  };

  const getDayColor = (dateStr) => {
    if (!activeBook) return '#eee';
    const read = activeBook.history[dateStr] || 0;
    const goal = activeBook.goal;
    if (read === 0) return '#eee';
    if (read === goal) return '#007AFF'; 
    return read > goal ? '#FFD700' : '#FF3B30';
  };

  const isFuture = new Date(selectedDate) > new Date(todayStr);

  if (isLoading) return <View style={styles.center}><Text>Загрузка...</Text></View>;

  return (
    <SafeAreaView style={styles.container}>
      
      {/* 🔐 ШАГ 1: ВЫБОР ВХОДА */}
      {screen === 'auth_choice' && (
        <View style={styles.centerBox}>
          <Text style={styles.headerTitle}>МОЙ ТРЕКЕР КНИГ</Text>
          <TouchableOpacity style={styles.orangeBtn} onPress={() => setScreen('login')}><Text style={styles.btnText}>ВХОД</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.orangeBtn, {marginTop: 20, backgroundColor: '#333'}]} onPress={() => setScreen('register')}><Text style={styles.btnText}>РЕГИСТРАЦИЯ</Text></TouchableOpacity>
        </View>
      )}

      {/* 👤 ВХОД / РЕГИСТРАЦИЯ */}
      {(screen === 'login' || screen === 'register') && (
        <View style={styles.centerBox}>
          <Text style={styles.headerTitle}>{screen === 'login' ? 'ВХОД' : 'РЕГИСТРАЦИЯ'}</Text>
<TextInput style={styles.setupInput} placeholder="Email" placeholderTextColor="#888" value={userEmail} onChangeText={setUserEmail} autoCapitalize="none" />
<TextInput style={styles.setupInput} placeholder="Пароль" placeholderTextColor="#888" secureTextEntry={true} value={userPass} onChangeText={setUserPass} />
          <TouchableOpacity style={styles.orangeBtn} onPress={() => handleAuth(screen === 'login' ? 'log' : 'reg')}><Text style={styles.btnText}>ГОТОВО</Text></TouchableOpacity>
          {screen === 'login' && <TouchableOpacity onPress={() => setScreen('forgot')} style={{marginTop: 15}}><Text style={{color: 'orange', textAlign: 'center'}}>Забыли пароль?</Text></TouchableOpacity>}
          <TouchableOpacity onPress={() => setScreen('auth_choice')} style={{marginTop: 20}}><Text style={{color: 'grey', textAlign: 'center'}}>Назад</Text></TouchableOpacity>
        </View>
      )}

      {/* 📧 ЗАБЫЛИ ПАРОЛЬ */}
      {screen === 'forgot' && (
        <View style={styles.centerBox}>
          <Text style={styles.headerTitle}>ВОССТАНОВЛЕНИЕ</Text>
          <TextInput style={styles.setupInput} placeholder="Введите ваш Email" value={resetEmail} onChangeText={setResetEmail} autoCapitalize="none" />
          <TouchableOpacity style={styles.orangeBtn} onPress={handleForgotPass}><Text style={styles.btnText}>НАПОМНИТЬ</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setScreen('login')} style={{marginTop: 20}}><Text style={{color: 'grey', textAlign: 'center'}}>Назад</Text></TouchableOpacity>
        </View>
      )}

      {/* 📚 БИБЛИОТЕКА */}
      {screen === 'library' && (
        <View style={styles.full}>
          <Text style={styles.headerTitle}>БИБЛИОТЕКА</Text>
          <ScrollView>
            {books.map(book => (
              <View key={book.id} style={styles.bookRow}>
                <TouchableOpacity style={{flex: 1, padding: 15}} onPress={() => {setActiveBookId(book.id); setScreen('tracker')}}>
                  <Text style={styles.cardMainTitle}>{book.title}</Text>
                  {book.completed ? (
                    <Text style={{color: 'green', fontWeight: 'bold'}}>🏆 {book.rewardName} (КОД: {book.promo})</Text>
                  ) : (
                    <Text style={styles.cardSubTitle}>Осталось: {calculateLeft(book)} стр</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => {setEditingBookId(book.id); setNewTitle(book.title); setNewTotal(book.totalPages.toString()); setNewGoal(book.goal.toString()); setScreen('setup');}}><Text>✏️</Text></TouchableOpacity>
                <TouchableOpacity style={styles.iconBtn} onPress={() => {setBookToDelete(book); setDeleteModal(true);}}><Text>🗑️</Text></TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addBtn} onPress={() => {setEditingBookId(null); setScreen('setup');}}><Text style={{color: 'orange', fontWeight: 'bold'}}>+ НОВАЯ КНИГА</Text></TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* 📝 НАСТРОЙКА КНИГИ */}
      {screen === 'setup' && (
        <View style={styles.centerBox}>
          <Text style={styles.headerTitle}>{editingBookId ? 'ИЗМЕНИТЬ' : 'НОВАЯ КНИГА'}</Text>
        <TextInput style={styles.setupInput} placeholder="Название" placeholderTextColor="#888" value={newTitle} onChangeText={setNewTitle} />
<TextInput style={styles.setupInput} placeholder="Всего страниц" placeholderTextColor="#888" keyboardType="numeric" value={newTotal} onChangeText={t => setNewTotal(t.replace(/[^0-9]/g, ''))} />
<TextInput style={styles.setupInput} placeholder="Норма в день" placeholderTextColor="#888" keyboardType="numeric" value={newGoal} onChangeText={g => setNewGoal(g.replace(/[^0-9]/g, ''))} />
          <TouchableOpacity style={styles.orangeBtn} onPress={() => {
            if (editingBookId) setBooks(books.map(b => b.id === editingBookId ? {...b, title: newTitle, totalPages: parseInt(newTotal), goal: parseInt(newGoal)} : b));
            else setBooks([...books, {id: Date.now(), title: newTitle, totalPages: parseInt(newTotal), goal: parseInt(newGoal), history: {}, completed: false, nextAttempt: 0}]);
            setScreen('library');
          }}><Text style={styles.btnText}>СОХРАНИТЬ</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setScreen('library')} style={{marginTop: 20}}><Text style={{color: 'grey', textAlign: 'center'}}>Отмена</Text></TouchableOpacity>
        </View>
      )}

      {/* 📅 ТРЕКЕР (ПОЛНЫЙ КАЛЕНДАРЬ + ПОЛЕ ВВОДА) */}
      {screen === 'tracker' && activeBook && (
        <View style={styles.full}>
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={() => {const d = new Date(currentWeekStart); d.setDate(d.getDate()-7); setCurrentWeekStart(d);}}><Text style={styles.arrow}>◀</Text></TouchableOpacity>
            <Text style={styles.monthName}>{currentWeekStart.toLocaleString('ru-RU', { month: 'long' }).toUpperCase()} {currentWeekStart.getFullYear()}</Text>
            <TouchableOpacity onPress={() => {const d = new Date(currentWeekStart); d.setDate(d.getDate()+7); setCurrentWeekStart(d);}}><Text style={styles.arrow}>▶</Text></TouchableOpacity>
          </View>
          
          <View style={styles.topCalendar}>
            {Array.from({length: 7}).map((_, i) => {
              const d = new Date(currentWeekStart); 
              d.setDate(d.getDate() - d.getDay() + (d.getDay() === 0 ? -6 : 1) + i);
              const dStr = d.toDateString();
              return (
                <TouchableOpacity key={i} onPress={() => setSelectedDate(dStr)} style={styles.dayNode}>
                  <View style={[styles.circle, { backgroundColor: getDayColor(dStr) }, dStr === todayStr && styles.todayBorder]}>
                    <Text style={{fontSize: 10, color: getDayColor(dStr) !== '#eee' ? 'white' : 'black'}}>{["ВС","ПН","ВТ","СР","ЧТ","ПТ","СБ"][d.getDay()]}</Text>
                    <Text style={{fontSize: 10, color: getDayColor(dStr) !== '#eee' ? 'white' : 'black'}}>{d.getDate()}</Text>
                  </View>
                  <View style={[styles.activeLine, dStr === selectedDate && {backgroundColor: 'black'}]} />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.centerBox}>
            <Text style={styles.headerTitle}>{activeBook.title}</Text>
            <Text style={{textAlign: 'center', marginBottom: 10, fontSize: 18}}>
               Осталось: {calculateLeft(activeBook)} стр | Норма: {activeBook.goal} стр
            </Text>
            
            <View style={{width: '100%', alignItems: 'center'}}>
              {activeBook.completed ? (
                 <Text style={styles.completedText}>КНИГА ПРОЙДЕНА! 🏆</Text>
              ) : calculateLeft(activeBook) === 0 ? (
                 Date.now() < activeBook.nextAttempt ? (
                   <Text style={styles.lockoutText}>ПОЧИТАЙ ЕЩЁ! 📚</Text>
                 ) : (
                   <TouchableOpacity style={[styles.orangeBtn, {backgroundColor: 'green', marginBottom: 20, width: '80%'}]} onPress={() => setScreen('test')}>
                     <Text style={styles.btnText}>ПРОЙТИ ТЕСТ 🥳</Text>
                   </TouchableOpacity>
                 )
              ) : null}

              {/* ПОЛЕ ВВОДА - ОНО ВСЕГДА ТУТ И ВСЕГДА РАБОТАЕТ */}
              <View style={[styles.inputBox, isFuture && {opacity: 0.5}]}>
                <Text style={{color: 'grey', marginBottom: 5}}>{isFuture ? "ЧИТАТЬ НАПЕРЁД НЕЛЬЗЯ!" : "Сколько прочитал сегодня?"}</Text>
                <TextInput style={styles.bigInput} keyboardType="numeric" editable={!isFuture}
                  value={(activeBook.history[selectedDate] || 0).toString()}
                  onChangeText={v => {
                    const n = parseInt(v.replace(/[^0-9]/g, '')) || 0;
                    const readOthers = Object.keys(activeBook.history).filter(d => d !== selectedDate).reduce((a,b)=>a+activeBook.history[b],0);
                    const max = activeBook.totalPages - readOthers;
                    const val = n > max ? max : n;
                    setBooks(books.map(b => b.id === activeBookId ? {...b, history: {...b.history, [selectedDate]: val}} : b));
                  }} />
              </View>
            </View>
          </View>
      <TouchableOpacity 
  // Добавляем marginBottom прямо в массив стилей
  style={[styles.orangeBtn, { marginBottom: 50, backgroundColor: '#333' }]} 
  onPress={() => setScreen('library')}
>
  <Text style={styles.btnText}>НАЗАД В БИБЛИОТЕКУ</Text>
</TouchableOpacity>

        </View>
      )}

      {/* ➔ ТЕСТ С ПОДТВЕРЖДЕНИЕМ */}
      {screen === 'test' && (
        <View style={styles.full}>
          <Text style={styles.headerTitle}>ВОПРОС {currentQuestion+1}</Text>
          <Text style={styles.questionText}>{testQuestions[currentQuestion].q}</Text>
          {testQuestions[currentQuestion].a.map((ans, i) => (
            <TouchableOpacity key={i} style={[styles.ansBtn, selectedAnswer === i && {borderColor: 'orange'}]} onPress={() => setSelectedAnswer(i)}><Text>{ans}</Text></TouchableOpacity>
          ))}
          {selectedAnswer !== null && (
            <TouchableOpacity style={styles.nextBtn} onPress={() => setConfirmModal(true)}><Text style={{color: 'white', fontSize: 24}}>➔</Text></TouchableOpacity>
          )}

          <Modal visible={confirmModal} transparent animationType="fade">
            <View style={styles.modalOverlay}><View style={styles.modalContent}>
                <Text style={styles.modalTitleText}>УВЕРЕН В ОТВЕТЕ?{'\n'}ИЗМЕНИТЬ НЕЛЬЗЯ!</Text>
                <View style={styles.modalRow}>
                  <TouchableOpacity onPress={() => setConfirmModal(false)}><Text style={{color: 'grey'}}>НЕТ</Text></TouchableOpacity>
                  <TouchableOpacity onPress={processAnswer}><Text style={{color: 'orange', fontWeight: 'bold'}}>ДА</Text></TouchableOpacity>
                </View>
            </View></View>
          </Modal>
        </View>
      )}

      {/* 🎁 НАГРАДЫ */}
      {screen === 'rewards' && (
        <View style={styles.full}>
          <Text style={styles.headerTitle}>ВЫБЕРИ НАГРАДУ 🎁</Text>
          <TouchableOpacity style={styles.rewardBtn} onPress={() => {setBooks(books.map(b => b.id === activeBookId ? {...b, completed: true, rewardName: 'Додо Пицца', promo: 'DODO-2026'} : b)); setScreen('library');}}><Text>🍕 Додо Пицца -20% (DODO-2026)</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.rewardBtn, {marginTop: 15}]} onPress={() => {setBooks(books.map(b => b.id === activeBookId ? {...b, completed: true, rewardName: 'Roblox', promo: 'ROBLOX-GOLD'} : b)); setScreen('library');}}><Text>🎮 Roblox (500 RB) (ROBLOX-GOLD)</Text></TouchableOpacity>
        </View>
      )}

      {/* МОДАЛКА УДАЛЕНИЯ */}
      <Modal visible={deleteModal} transparent><View style={styles.modalOverlay}><View style={styles.modalContent}>
          <Text style={{fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 20}}>УДАЛИТЬ КНИГУ?</Text>
          <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
            <TouchableOpacity onPress={() => setDeleteModal(false)}><Text>НЕТ</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => { setBooks(books.filter(b => b.id !== bookToDelete.id)); setDeleteModal(false); }}><Text style={{color: 'red', fontWeight: 'bold'}}>УДАЛИТЬ</Text></TouchableOpacity>
          </View>
      </View></View></Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  full: { flex: 1, padding: 20, paddingTop: 50 },
  centerBox: { flex: 1, justifyContent: 'center', padding: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  setupInput: { borderBottomWidth: 2, borderBottomColor: 'orange', marginBottom: 20, fontSize: 18, padding: 5, color: '#000' },
  orangeBtn: { backgroundColor: 'orange', padding: 15, borderRadius: 15, alignItems: 'center' },
  btnText: { color: 'white', fontWeight: 'bold' },
  bookRow: { flexDirection: 'row', backgroundColor: '#f9f9f9', borderRadius: 15, marginBottom: 10, alignItems: 'center' },
  iconBtn: { padding: 15 },
  addBtn: { borderStyle: 'dashed', borderWidth: 1, borderColor: 'orange', padding: 15, borderRadius: 15, alignItems: 'center' },
  monthHeader: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  monthName: { fontSize: 18, fontWeight: 'bold', marginHorizontal: 20 },
  arrow: { fontSize: 24, color: 'orange' },
  topCalendar: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  dayNode: { alignItems: 'center' },
  circle: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#eee', justifyContent: 'center', alignItems: 'center' },
  todayBorder: { borderWidth: 2, borderColor: 'green' },
  activeLine: { height: 3, width: 20, marginTop: 5 },
  inputBox: { alignItems: 'center', marginTop: 10 },
  bigInput: { fontSize: 60, fontWeight: 'bold', textAlign: 'center' },
  backBtn: { backgroundColor: '#333', padding: 15, borderRadius: 15, alignItems: 'center', marginTop: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: 'white', padding: 25, borderRadius: 20 },
  modalTitleText: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 15 },
  modalRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  ansBtn: { padding: 15, backgroundColor: '#f0f0f0', borderRadius: 10, marginBottom: 10, borderWidth: 2, borderColor: 'transparent' },
  nextBtn: { backgroundColor: 'orange', width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginTop: 10 },
  questionText: { fontSize: 22, textAlign: 'center', marginBottom: 30 },
  rewardBtn: { padding: 25, backgroundColor: '#FFF9C4', borderRadius: 15, borderWidth: 1, borderColor: 'orange', alignItems: 'center' },
  completedText: { color: 'green', fontWeight: 'bold', fontSize: 20, textAlign: 'center', marginBottom: 20 },
  lockoutText: { color: 'red', fontWeight: 'bold', fontSize: 20, textAlign: 'center', marginBottom: 20 },
  cardMainTitle: { fontSize: 18, fontWeight: 'bold' },
  cardSubTitle: { color: 'grey', fontSize: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});
