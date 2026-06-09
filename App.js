  zh: {
    months: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
    days: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'],
    brand: 'My Book Tracker',
    library: '图书馆',
    settings: '设置',
    emptyTitle: '暂无书籍',
    emptyText: '添加第一本书，按天记录阅读进度。',
    addBook: '+ 新书',
    bookFinished: '书已读完',
    leftOfTotal: (left, total) => `还剩 ${left} 页，共 ${total} 页`,
    addMode: '添加',
    editMode: '编辑',
    newBook: '新书',
    editBook: '编辑书籍',
    title: '书名',
    titlePlaceholder: '输入书名',
    totalPages: '总页数',
    dailyNorm: '每日目标',
    save: '保存',
    cancel: '取消',
    todayHint: '回到今天',
    noBook: '无书籍',
    calendarSub: (left, norm) => `还剩 ${left} 页 | 目标 ${norm} 页`,
    futureClosed: '未来日期已锁定',
    pagesQuestion: '你今天读了多少页？',
    congrats: '恭喜，你读完了这本书！',
    backToLibrary: '返回图书馆',
    language: '语言',
    theme: '主题',
    light: '浅色',
    dark: '深色',
    appSettings: '应用设置',
    settingsHint: '选择界面语言和主题。设置将自动保存。',
    error: '错误',
    loadError: '无法加载书籍',
    saveError: '无法保存更改',
    fillFields: '请填写所有字段',
    enterNumbers: '请输入大于零的数字',
    deleteTitle: '删除',
    deleteMessage: '从图书馆中删除这本书？',
    delete: '删除',
  },
};

// ========== КОНЕЦ СЛОВАРЯ DICTIONARIES ==========

const getStartOfWeek = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d;
};

const formatDateKey = (dateObj) => {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const loadSettings = async () => {
  try {
    const saved = await AsyncStorage.getItem(SETTINGS_KEY);
    if (saved) return JSON.parse(saved);
    return { language: 'ru', theme: 'light' };
  } catch {
    return { language: 'ru', theme: 'light' };
  }
};

const saveSettings = async (settings) => {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.warn('Failed to save settings', e);
  }
};

export default function App() {
  const [screen, setScreen] = useState('library');
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [bookTitle, setBookTitle] = useState('');
  const [totalPages, setTotalPages] = useState('');
  const [dailyNorm, setDailyNorm] = useState('');
  const [editingBookId, setEditingBookId] = useState(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [selectedDayOffset, setSelectedDayOffset] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [lang, setLang] = useState('ru');
  const [theme, setTheme] = useState('light');
  const timeoutRef = useRef(null);

  const t = dictionaries[lang] || dictionaries.en;

  useEffect(() => {
    loadSettings().then((settings) => {
      setLang(settings.language);
      setTheme(settings.theme);
    });
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
      Alert.alert(t.error, t.loadError);
    }
  };

  const saveBooks = async (updatedBooks) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedBooks));
      setBooks(updatedBooks);
    } catch (e) {
      Alert.alert(t.error, t.saveError);
    }
  };

  const resetForm = () => {
    setBookTitle('');
    setTotalPages('');
    setDailyNorm('');
    setEditingBookId(null);
  };

  const activeBook = useMemo(() => books.find(b => b.id === selectedBookId), [books, selectedBookId]);

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

  useEffect(() => {
    const val = activeBook?.progress?.[selectedDateKey] || 0;
    setInputValue(val === 0 ? '' : val.toString());
  }, [selectedDateKey, selectedBookId, activeBook]);

  const totalReadPages = useMemo(() => {
    if (!activeBook) return 0;
    return Object.values(activeBook.progress || {}).reduce((sum, v) => sum + (parseInt(v, 10) || 0), 0);
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
    Object.keys(activeBook.progress || {}).forEach((key) => {
      if (key !== selectedDateKey) readWithoutToday += parseInt(activeBook.progress[key], 10) || 0;
    });

    const maxAvailable = activeBook.totalPages - readWithoutToday;
    if (entered > maxAvailable) entered = maxAvailable;

    const updated = books.map((b) => {
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
      Alert.alert(t.error, t.fillFields);
      return;
    }
    const total = parseInt(totalPages, 10);
    let norm = parseInt(dailyNorm, 10);
    if (isNaN(total) || isNaN(norm) || total <= 0 || norm <= 0) {
      Alert.alert(t.error, t.enterNumbers);
      return;
    }
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
      const updated = books.map((b) => {
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
    Alert.alert(t.deleteTitle, t.deleteMessage, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
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

  const goPrevWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
    setSelectedDayOffset(0);
  };

  const goNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
    setSelectedDayOffset(0);
  };

  const goToToday = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
    setSelectedDayOffset(0);
  };

  const displayMonth = weekDays[0]?.getMonth() || 0;
  const displayYear = weekDays[0]?.getFullYear() || 2026;

  const changeLanguage = async (code) => {
    setLang(code);
    await saveSettings({ language: code, theme });
  };

  const changeTheme = async (newTheme) => {
    setTheme(newTheme);
    await saveSettings({ language: lang, theme: newTheme });
  };

  const palettes = {
    light: {
      background: '#fbf7ef',
      accent: '#ffd08a',
      card: 'rgba(255,255,255,0.88)',
      cardStrong: '#fffaf2',
      border: '#f1dfc9',
      borderStrong: '#ead6bd',
      text: '#241f1a',
      muted: '#796f63',
      mutedSoft: '#9a9488',
      primary: '#d87520',
      primaryText: '#fffaf2',
      green: '#27745e',
      darkButton: '#241f1a',
      tabBar: '#fffaf2',
      shadow: '#3a2411',
      disabledBg: '#f1ece4',
      disabledText: '#a99f93',
    },
    dark: {
      background: '#12100e',
      accent: '#6d4219',
      card: 'rgba(38,34,30,0.92)',
      cardStrong: '#211d19',
      border: '#3a3028',
      borderStrong: '#574638',
      text: '#fff4e4',
      muted: '#cab9a3',
      mutedSoft: '#9d8d7b',
      primary: '#f09a3e',
      primaryText: '#1a120b',
      green: '#67c29a',
      darkButton: '#f6dfbf',
      tabBar: '#1d1916',
      shadow: '#000000',
      disabledBg: '#2b2621',
      disabledText: '#7f7163',
    },
  };

  const colors = palettes[theme] || palettes.light;

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    backgroundAccent: { position: 'absolute', top: -80, right: -80, width: width * 0.75, height: width * 0.75, borderRadius: width, backgroundColor: colors.accent, opacity: 0.45 },
    content: { flex: 1, width: '100%', paddingHorizontal: 22, paddingTop: 20, paddingBottom: 8 },
    header: { marginBottom: 22 },
    kicker: { color: colors.primary, fontSize: 13, fontWeight: '700', letterSpacing: 0, textTransform: 'uppercase' },
    screenTitle: { marginTop: 6, color: colors.text, fontSize: 34, fontWeight: '800' },
    headerHint: { marginTop: 10, color: colors.muted, fontSize: 15, lineHeight: 22 },
    scrollList: { flex: 1 },
    emptyState: { minHeight: 180, borderRadius: 8, padding: 22, justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    emptyTitle: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 8 },
    emptyText: { color: colors.muted, fontSize: 15, lineHeight: 22 },
    bookCard: { minHeight: 112, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 2 },
    bookCardMain: { flex: 1, paddingRight: 12 },
    bookCardTitle: { color: colors.text, fontSize: 21, fontWeight: '800', marginBottom: 6 },
    bookCardSub: { color: colors.muted, fontSize: 14 },
    cardActions: { flexDirection: 'row', alignItems: 'center' },
    iconBtn: { width: 34, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardStrong, marginLeft: 8, borderWidth: 1, borderColor: colors.border },
    iconText: { color: colors.primary, fontSize: 21, fontWeight: '700' },
    primaryButton: { width: '100%', minHeight: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginTop: 16, marginBottom: 12, shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.22, shadowRadius: 18, elevation: 3 },
    primaryButtonText: { color: colors.primaryText, fontSize: 17, fontWeight: '800' },
    formScreen: { flex: 1 },
    formContainer: { width: '100%' },
    inputBlock: { width: '100%', marginBottom: 20 },
    inputLabel: { color: colors.muted, fontSize: 15, fontWeight: '700', marginBottom: 8 },
    borderInput: { width: '100%', minHeight: 54, borderWidth: 1, borderColor: colors.borderStrong, borderRadius: 8, paddingHorizontal: 14, color: colors.text, backgroundColor: colors.card, fontSize: 17 },
    secondaryButton: { alignSelf: 'center', paddingVertical: 12, paddingHorizontal: 18 },
    secondaryButtonText: { color: colors.muted, fontSize: 15, fontWeight: '700' },
    monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 },
    roundButton: { width: 42, height: 42, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.borderStrong },
    roundButtonText: { color: colors.primary, fontSize: 30, lineHeight: 32 },
    todayButton: { alignItems: 'center' },
    monthText: { color: colors.text, fontSize: 19, fontWeight: '800' },
    todayHint: { color: colors.muted, fontSize: 12, marginTop: 3 },
    weekContainer: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: 22 },
    dayCircle: { width: 44, height: 58, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.borderStrong },
    todayCircle: { borderColor: colors.green, borderWidth: 2 },
    selectedDayCircle: { backgroundColor: colors.primary, borderColor: colors.primary },
    selectedDayText: { color: colors.primaryText },
    dayWeekText: { color: colors.muted, fontSize: 10, fontWeight: '800' },
    dayNumText: { color: colors.text, fontSize: 16, fontWeight: '800', marginTop: 3 },
    progressDot: { position: 'absolute', bottom: 5, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.green },
    bookSummary: { borderRadius: 8, padding: 18, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
    calendarBookTitle: { color: colors.text, fontSize: 27, fontWeight: '800', marginBottom: 8 },
    calendarBookSub: { color: colors.muted, fontSize: 15, marginBottom: 12 },
    progressBarContainer: { width: '100%', height: 8, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.borderStrong, marginTop: 10 },
    progressBarFill: { height: '100%', borderRadius: 8, backgroundColor: colors.green },
    statusMessage: { color: colors.muted, fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: 28, marginBottom: 12 },
    counterContainer: { flex: 1, alignItems: 'center', width: '100%' },
    bigCounterInput: { width: '100%', minHeight: 126, borderRadius: 8, backgroundColor: colors.cardStrong, borderWidth: 1, borderColor: colors.borderStrong, color: colors.text, fontSize: 72, fontWeight: '800', textAlign: 'center', paddingHorizontal: 20, includeFontPadding: false, textAlignVertical: 'center' },
    disabledInput: { color: colors.disabledText, backgroundColor: colors.disabledBg },
    congratsBlock: { marginTop: 16, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.green },
    congratsText: { color: colors.green, fontSize: 16, fontWeight: '800', textAlign: 'center' },
    darkButton: { width: '100%', minHeight: 54, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.darkButton, marginBottom: 10 },
    darkButtonText: { color: colors.background, fontSize: 15, fontWeight: '800' },
    settingsSection: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 16, marginBottom: 14 },
    sectionTitle: { color: colors.text, fontSize: 19, fontWeight: '800', marginBottom: 12 },
    segmented: { flexDirection: 'row', gap: 10 },
    segmentButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 8, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.cardStrong },
    selectedSegment: { backgroundColor: colors.primary, borderColor: colors.primary },
    segmentText: { color: colors.text, fontSize: 15, fontWeight: '800' },
    selectedSegmentText: { color: colors.primaryText },
    languageRow: { minHeight: 50, borderRadius: 8, borderWidth: 1, borderColor: colors.borderStrong, backgroundColor: colors.cardStrong, paddingHorizontal: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    selectedLanguageRow: { borderColor: colors.primary, backgroundColor: colors.primary },
    languageText: { color: colors.text, fontSize: 16, fontWeight: '800' },
    checkText: { color: colors.primary, fontSize: 18, fontWeight: '900' },
    selectedLanguageText: { color: colors.primaryText },
    tabBar: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 10, paddingBottom: Platform.OS === 'ios' ? 8 : 12, backgroundColor: colors.tabBar, borderTopWidth: 1, borderTopColor: colors.border },
    tabButton: { flex: 1, minHeight: 54, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card },
    activeTabButton: { backgroundColor: colors.primary, borderColor: colors.primary },
    tabIcon: { color: colors.muted, fontSize: 18, fontWeight: '800', marginBottom: 2 },
    tabLabel: { color: colors.muted, fontSize: 12, fontWeight: '800' },
    activeTabText: { color: colors.primaryText },
  });

  const renderBottomTabs = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity style={[styles.tabButton, activeTab === 'library' && styles.activeTabButton]} onPress={() => { resetForm(); setScreen('library'); }}>
        <Text style={[styles.tabIcon, activeTab === 'library' && styles.activeTabText]}>▦</Text>
        <Text style={[styles.tabLabel, activeTab === 'library' && styles.activeTabText]}>{t.library}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.tabButton, activeTab === 'settings' && styles.activeTabButton]} onPress={() => { resetForm(); setScreen('settings'); }}>
        <Text style={[styles.tabIcon, activeTab === 'settings' && styles.activeTabText]}>⚙</Text>
        <Text style={[styles.tabLabel, activeTab === 'settings' && styles.activeTabText]}>{t.settings}</Text>
      </TouchableOpacity>
    </View>
  );

  const activeTab = screen === 'settings' ? 'settings' : 'library';

  const renderShell = (children) => (
    <SafeAreaView style={styles.container}>
      <View style={styles.backgroundAccent} />
      <View style={styles.content}>{children}</View>
      {renderBottomTabs()}
    </SafeAreaView>
  );

  if (screen === 'settings') {
    return renderShell(
      <>
        <View style={styles.header}>
          <Text style={styles.kicker}>{t.brand}</Text>
          <Text style={styles.screenTitle}>{t.appSettings}</Text>
          <Text style={styles.headerHint}>{t.settingsHint}</Text>
        </View>
        <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>{t.theme}</Text>
            <View style={styles.segmented}>
              <TouchableOpacity style={[styles.segmentButton, theme === 'light' && styles.selectedSegment]} onPress={() => changeTheme('light')}>
                <Text style={[styles.segmentText, theme === 'light' && styles.selectedSegmentText]}>☀ {t.light}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.segmentButton, theme === 'dark' && styles.selectedSegment]} onPress={() => changeTheme('dark')}>
                <Text style={[styles.segmentText, theme === 'dark' && styles.selectedSegmentText]}>◐ {t.dark}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>{t.language}</Text>
            {languages.map((item) => {
              const selected = lang === item.code;
              return (
                <TouchableOpacity key={item.code} style={[styles.languageRow, selected && styles.selectedLanguageRow]} onPress={() => changeLanguage(item.code)}>
                  <Text style={[styles.languageText, selected && styles.selectedLanguageText]}>{item.label}</Text>
                  <Text style={[styles.checkText, selected && styles.selectedLanguageText]}>{selected ? '✓' : ''}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </>
    );
  }

  if (screen === 'library') {
    return renderShell(
      <>
        <View style={styles.header}>
          <Text style={styles.kicker}>{t.brand}</Text>
          <Text style={styles.screenTitle}>{t.library}</Text>
        </View>
        <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
          {books.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>{t.emptyTitle}</Text>
              <Text style={styles.emptyText}>{t.emptyText}</Text>
            </View>
          )}
          {books.map((item) => {
            const itemRead = Object.values(item.progress || {}).reduce((a,b)=> (parseInt(a,10)||0)+(parseInt(b,10)||0),0);
            const itemLeft = Math.max(0, item.totalPages - itemRead);
            const itemProgressPercent = item.totalPages ? ((item.totalPages - itemLeft) / item.totalPages) * 100 : 0;
            return (
              <TouchableOpacity key={item.id} style={styles.bookCard} onPress={() => { setSelectedBookId(item.id); setCurrentWeekStart(getStartOfWeek(new Date())); setSelectedDayOffset(0); setScreen('calendar'); }}>
                <View style={styles.bookCardMain}>
                  <Text style={styles.bookCardTitle} numberOfLines={2}>{item.title}</Text>
                  <Text style={styles.bookCardSub}>{itemLeft === 0 ? t.bookFinished : t.leftOfTotal(itemLeft, item.totalPages)}</Text>
                  <View style={styles.progressBarContainer}>
                    <View style={[styles.progressBarFill, { width: `${itemProgressPercent}%` }]} />
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => openEditBook(item)}><Text style={styles.iconText}>✎</Text></TouchableOpacity>
                  <TouchableOpacity style={styles.iconBtn} onPress={() => handleDeleteBook(item.id)}><Text style={styles.iconText}>×</Text></TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity style={styles.primaryButton} onPress={() => setScreen('new_book')}><Text style={styles.primaryButtonText}>{t.addBook}</Text></TouchableOpacity>
      </>
    );
  }

  if (screen === 'new_book' || screen === 'edit_book') {
    return renderShell(
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.formScreen}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{screen === 'new_book' ? t.addMode : t.editMode}</Text>
          <Text style={styles.screenTitle}>{screen === 'new_book' ? t.newBook : t.editBook}</Text>
        </View>
        <View style={styles.formContainer}>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>{t.title}</Text>
            <TextInput style={styles.borderInput} value={bookTitle} onChangeText={setBookTitle} placeholder={t.titlePlaceholder} placeholderTextColor={colors.mutedSoft} />
          </View>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>{t.totalPages}</Text>
            <TextInput style={styles.borderInput} keyboardType="numeric" value={totalPages} onChangeText={text => setTotalPages(text.replace(/[^0-9]/g, ''))} placeholder="0" placeholderTextColor={colors.mutedSoft} />
          </View>
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>{t.dailyNorm}</Text>
            <TextInput style={styles.borderInput} keyboardType="numeric" value={dailyNorm} onChangeText={text => setDailyNorm(text.replace(/[^0-9]/g, ''))} placeholder="0" placeholderTextColor={colors.mutedSoft} />
          </View>
          <TouchableOpacity style={styles.primaryButton} onPress={handleSaveBook}><Text style={styles.primaryButtonText}>{t.save}</Text></TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} onPress={() => { resetForm(); setScreen('library'); }}><Text style={styles.secondaryButtonText}>{t.cancel}</Text></TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return renderShell(
    <>
      <View style={styles.monthHeader}>
        <TouchableOpacity style={styles.roundButton} onPress={goPrevWeek}><Text style={styles.roundButtonText}>‹</Text></TouchableOpacity>
        <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
          <Text style={styles.monthText}>{t.months[displayMonth]} {displayYear}</Text>
          <Text style={styles.todayHint}>{t.todayHint}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.roundButton} onPress={goNextWeek}><Text style={styles.roundButtonText}>›</Text></TouchableOpacity>
      </View>
      <View style={styles.weekContainer}>
        {weekDays.map((day, idx) => {
          const isToday = formatDateKey(day) === todayKey;
          const isSelected = selectedDayOffset === idx;
          return (
            <TouchableOpacity key={formatDateKey(day)} style={[styles.dayCircle, isToday && styles.todayCircle, isSelected && styles.selectedDayCircle]} onPress={() => setSelectedDayOffset(idx)}>
              <Text style={[styles.dayWeekText, isSelected && styles.selectedDayText]}>{t.days[day.getDay()]}</Text>
              <Text style={[styles.dayNumText, isSelected && styles.selectedDayText]}>{day.getDate()}</Text>
              {hasProgressOnDay(day) && <View style={styles.progressDot} />}
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={styles.bookSummary}>
        <Text style={styles.calendarBookTitle} numberOfLines={2}>{activeBook?.title || t.noBook}</Text>
        <Text style={styles.calendarBookSub}>{t.calendarSub(leftPages, activeBook?.dailyNorm || 0)}</Text>
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBarFill, { width: `${(totalReadPages / (activeBook?.totalPages || 1)) * 100}%` }]} />
        </View>
      </View>
      <Text style={styles.statusMessage}>{isFuture ? t.futureClosed : t.pagesQuestion}</Text>
      <View style={styles.counterContainer}>
        <TextInput style={[styles.bigCounterInput, isFuture && styles.disabledInput]} keyboardType="number-pad" value={inputValue} onChangeText={handleUpdateProgress} placeholder="0" placeholderTextColor={colors.mutedSoft} editable={!isFuture} />
        {isBookFinished && (
          <View style={styles.congratsBlock}>
            <Text style={styles.congratsText}>{t.congrats}</Text>
          </View>
        )}
      </View>
      <TouchableOpacity style={styles.darkButton} onPress={() => setScreen('library')}>
        <Text style={styles.darkButtonText}>{t.backToLibrary}</Text>
      </TouchableOpacity>
    </>
  );
}
