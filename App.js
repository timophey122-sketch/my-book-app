import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

const STORAGE_KEY = 'BOOK_TRACKER_V2';
const SETTINGS_KEY = 'BOOK_TRACKER_SETTINGS_V1';

const languages = [
  { code: 'ru', label: 'Русский' },
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'pt', label: 'Português' },
  { code: 'pl', label: 'Polski' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'sv', label: 'Svenska' },
  { code: 'ar', label: 'العربية' },
  { code: 'ja', label: '日本語' },
  { code: 'ko', label: '한국어' },
  { code: 'zh', label: '中文' },
];

const dictionaries = {
  ru: {
    months: ['ЯНВАРЬ', 'ФЕВРАЛЬ', 'МАРТ', 'АПРЕЛЬ', 'МАЙ', 'ИЮНЬ', 'ИЮЛЬ', 'АВГУСТ', 'СЕНТЯБРЬ', 'ОКТЯБРЬ', 'НОЯБРЬ', 'ДЕКАБРЬ'],
    days: ['ВС', 'ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ'],
    brand: 'My Book Tracker',
    library: 'Библиотека',
    settings: 'Настройки',
    emptyTitle: 'Пока нет книг',
    emptyText: 'Добавьте первую книгу и отмечайте прогресс по дням.',
    addBook: '+ Новая книга',
    bookFinished: 'Книга прочитана',
    leftOfTotal: (left, total) => `Осталось ${left} стр. из ${total}`,
    addMode: 'Добавление',
    editMode: 'Редактирование',
    newBook: 'Новая книга',
    editBook: 'Изменить книгу',
    title: 'Название',
    titlePlaceholder: 'Введите название книги',
    totalPages: 'Всего страниц',
    dailyNorm: 'Норма в день',
    save: 'Сохранить',
    cancel: 'Отмена',
    todayHint: 'к сегодняшнему дню',
    noBook: 'Без книги',
    calendarSub: (left, norm) => `Осталось ${left} стр. | Норма ${norm} стр.`,
    futureClosed: 'Будущие дни пока закрыты',
    pagesQuestion: 'Сколько страниц прочитано?',
    congrats: 'Поздравляю, книга прочитана!',
    backToLibrary: 'Назад в библиотеку',
    language: 'Язык',
    theme: 'Тема',
    light: 'Светлая',
    dark: 'Темная',
    appSettings: 'Настройки приложения',
    settingsHint: 'Выберите язык интерфейса и тему. Настройки сохранятся автоматически.',
    error: 'Ошибка',
    loadError: 'Не удалось загрузить книги',
    saveError: 'Не удалось сохранить изменения',
    fillFields: 'Заполните все поля',
    enterNumbers: 'Введите числа больше нуля',
    deleteTitle: 'Удаление',
    deleteMessage: 'Удалить книгу из библиотеки?',
    delete: 'Удалить',
  },
  en: {
    months: ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'],
    days: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    brand: 'My Book Tracker',
    library: 'Library',
    settings: 'Settings',
    emptyTitle: 'No books yet',
    emptyText: 'Add your first book and track reading progress by day.',
    addBook: '+ New book',
    bookFinished: 'Book finished',
    leftOfTotal: (left, total) => `${left} pages left of ${total}`,
    addMode: 'Adding',
    editMode: 'Editing',
    newBook: 'New book',
    editBook: 'Edit book',
    title: 'Title',
    titlePlaceholder: 'Enter book title',
    totalPages: 'Total pages',
    dailyNorm: 'Daily goal',
    save: 'Save',
    cancel: 'Cancel',
    todayHint: 'go to today',
    noBook: 'No book',
    calendarSub: (left, norm) => `${left} pages left | Goal ${norm} pages`,
    futureClosed: 'Future days are locked',
    pagesQuestion: 'How many pages did you read?',
    congrats: 'Congrats, the book is finished!',
    backToLibrary: 'Back to library',
    language: 'Language',
    theme: 'Theme',
    light: 'Light',
    dark: 'Dark',
    appSettings: 'App settings',
    settingsHint: 'Choose interface language and theme. Settings are saved automatically.',
    error: 'Error',
    loadError: 'Could not load books',
    saveError: 'Could not save changes',
    fillFields: 'Fill in all fields',
    enterNumbers: 'Enter numbers greater than zero',
    deleteTitle: 'Delete',
    deleteMessage: 'Delete this book from the library?',
    delete: 'Delete',
  },
  es: {
    months: ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'],
    days: ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'],
    brand: 'My Book Tracker',
    library: 'Biblioteca',
    settings: 'Ajustes',
    emptyTitle: 'Aún no hay libros',
    emptyText: 'Añade tu primer libro y registra el progreso por días.',
    addBook: '+ Nuevo libro',
    bookFinished: 'Libro terminado',
    leftOfTotal: (left, total) => `Quedan ${left} págs. de ${total}`,
    addMode: 'Añadir',
    editMode: 'Editar',
    newBook: 'Nuevo libro',
    editBook: 'Editar libro',
    title: 'Título',
    titlePlaceholder: 'Introduce el título',
    totalPages: 'Páginas totales',
    dailyNorm: 'Meta diaria',
    save: 'Guardar',
    cancel: 'Cancelar',
    todayHint: 'ir a hoy',
    noBook: 'Sin libro',
    calendarSub: (left, norm) => `Quedan ${left} págs. | Meta ${norm} págs.`,
    futureClosed: 'Los días futuros están cerrados',
    pagesQuestion: '¿Cuántas páginas leíste?',
    congrats: '¡Felicidades, terminaste el libro!',
    backToLibrary: 'Volver a biblioteca',
    language: 'Idioma',
    theme: 'Tema',
    light: 'Clara',
    dark: 'Oscura',
    appSettings: 'Ajustes de la app',
    settingsHint: 'Elige idioma y tema. Los ajustes se guardan automáticamente.',
    error: 'Error',
    loadError: 'No se pudieron cargar los libros',
    saveError: 'No se pudieron guardar los cambios',
    fillFields: 'Completa todos los campos',
    enterNumbers: 'Introduce números mayores que cero',
    deleteTitle: 'Eliminar',
    deleteMessage: '¿Eliminar este libro de la biblioteca?',
    delete: 'Eliminar',
  },
  fr: {
    months: ['JANVIER', 'FÉVRIER', 'MARS', 'AVRIL', 'MAI', 'JUIN', 'JUILLET', 'AOÛT', 'SEPTEMBRE', 'OCTOBRE', 'NOVEMBRE', 'DÉCEMBRE'],
    days: ['DIM', 'LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM'],
    brand: 'My Book Tracker',
    library: 'Bibliothèque',
    settings: 'Réglages',
    emptyTitle: 'Aucun livre',
    emptyText: 'Ajoutez votre premier livre et suivez vos progrès par jour.',
    addBook: '+ Nouveau livre',
    bookFinished: 'Livre terminé',
    leftOfTotal: (left, total) => `${left} pages restantes sur ${total}`,
    addMode: 'Ajout',
    editMode: 'Modification',
    newBook: 'Nouveau livre',
    editBook: 'Modifier le livre',
    title: 'Titre',
    titlePlaceholder: 'Saisissez le titre',
    totalPages: 'Pages totales',
    dailyNorm: 'Objectif quotidien',
    save: 'Enregistrer',
    cancel: 'Annuler',
    todayHint: "aller à aujourd'hui",
    noBook: 'Aucun livre',
    calendarSub: (left, norm) => `${left} pages restantes | Objectif ${norm}`,
    futureClosed: 'Les jours futurs sont verrouillés',
    pagesQuestion: 'Combien de pages lues ?',
    congrats: 'Bravo, le livre est terminé !',
    backToLibrary: 'Retour à la bibliothèque',
    language: 'Langue',
    theme: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    appSettings: "Réglages de l'app",
    settingsHint: "Choisissez la langue et le thème. Les réglages sont enregistrés automatiquement.",
    error: 'Erreur',
    loadError: 'Impossible de charger les livres',
    saveError: 'Impossible d’enregistrer',
    fillFields: 'Remplissez tous les champs',
    enterNumbers: 'Entrez des nombres supérieurs à zéro',
    deleteTitle: 'Suppression',
    deleteMessage: 'Supprimer ce livre ?',
    delete: 'Supprimer',
  },
  de: {
    months: ['JANUAR', 'FEBRUAR', 'MÄRZ', 'APRIL', 'MAI', 'JUNI', 'JULI', 'AUGUST', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DEZEMBER'],
    days: ['SO', 'MO', 'DI', 'MI', 'DO', 'FR', 'SA'],
    brand: 'My Book Tracker',
    library: 'Bibliothek',
    settings: 'Einstellungen',
    emptyTitle: 'Keine Bücher',
    emptyText: 'Füge dein erstes Buch hinzu und verfolge den Fortschritt Tag für Tag.',
    addBook: '+ Neues Buch',
    bookFinished: 'Buch fertig',
    leftOfTotal: (left, total) => `${left} Seiten übrig von ${total}`,
    addMode: 'Hinzufügen',
    editMode: 'Bearbeiten',
    newBook: 'Neues Buch',
    editBook: 'Buch bearbeiten',
    title: 'Titel',
    titlePlaceholder: 'Buchtitel eingeben',
    totalPages: 'Gesamtseiten',
    dailyNorm: 'Tagesziel',
    save: 'Speichern',
    cancel: 'Abbrechen',
    todayHint: 'zu heute',
    noBook: 'Kein Buch',
    calendarSub: (left, norm) => `${left} Seiten übrig | Ziel ${norm} Seiten`,
    futureClosed: 'Zukünftige Tage sind gesperrt',
    pagesQuestion: 'Wie viele Seiten hast du gelesen?',
    congrats: 'Glückwunsch, das Buch ist fertig!',
    backToLibrary: 'Zurück zur Bibliothek',
    language: 'Sprache',
    theme: 'Design',
    light: 'Hell',
    dark: 'Dunkel',
    appSettings: 'App-Einstellungen',
    settingsHint: 'Wähle Sprache und Design. Einstellungen werden automatisch gespeichert.',
    error: 'Fehler',
    loadError: 'Bücher konnten nicht geladen werden',
    saveError: 'Änderungen konnten nicht gespeichert werden',
    fillFields: 'Fülle alle Felder aus',
    enterNumbers: 'Gib Zahlen größer als null ein',
    deleteTitle: 'Löschen',
    deleteMessage: 'Dieses Buch löschen?',
    delete: 'Löschen',
  },
  it: {
    months: ['GENNAIO', 'FEBBRAIO', 'MARZO', 'APRILE', 'MAGGIO', 'GIUGNO', 'LUGLIO', 'AGOSTO', 'SETTEMBRE', 'OTTOBRE', 'NOVEMBRE', 'DICEMBRE'],
    days: ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'],
    brand: 'My Book Tracker',
    library: 'Biblioteca',
    settings: 'Impostazioni',
    emptyTitle: 'Nessun libro',
    emptyText: 'Aggiungi il tuo primo libro e traccia i progressi giorno per giorno.',
    addBook: '+ Nuovo libro',
    bookFinished: 'Libro completato',
    leftOfTotal: (left, total) => `${left} pagine rimaste su ${total}`,
    addMode: 'Aggiunta',
    editMode: 'Modifica',
    newBook: 'Nuovo libro',
    editBook: 'Modifica libro',
    title: 'Titolo',
    titlePlaceholder: 'Inserisci il titolo',
    totalPages: 'Pagine totali',
    dailyNorm: 'Obiettivo giornaliero',
    save: 'Salva',
    cancel: 'Annulla',
    todayHint: 'vai a oggi',
    noBook: 'Nessun libro',
    calendarSub: (left, norm) => `${left} pag. rimaste | Obiettivo ${norm} pag.`,
    futureClosed: 'Giorni futuri bloccati',
    pagesQuestion: 'Quante pagine hai letto?',
    congrats: 'Congratulazioni, libro completato!',
    backToLibrary: 'Torna alla biblioteca',
    language: 'Lingua',
    theme: 'Tema',
    light: 'Chiaro',
    dark: 'Scuro',
    appSettings: 'Impostazioni app',
    settingsHint: 'Scegli lingua e tema. Le impostazioni si salvano automaticamente.',
    error: 'Errore',
    loadError: 'Impossibile caricare i libri',
    saveError: 'Impossibile salvare le modifiche',
    fillFields: 'Compila tutti i campi',
    enterNumbers: 'Inserisci numeri maggiori di zero',
    deleteTitle: 'Elimina',
    deleteMessage: 'Eliminare questo libro dalla biblioteca?',
    delete: 'Elimina',
  },
  pt: {
    months: ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'],
    days: ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'],
    brand: 'My Book Tracker',
    library: 'Biblioteca',
    settings: 'Configurações',
    emptyTitle: 'Nenhum livro',
    emptyText: 'Adicione seu primeiro livro e acompanhe o progresso por dia.',
    addBook: '+ Novo livro',
    bookFinished: 'Livro concluído',
    leftOfTotal: (left, total) => `${left} páginas restantes de ${total}`,
    addMode: 'Adicionando',
    editMode: 'Editando',
    newBook: 'Novo livro',
    editBook: 'Editar livro',
    title: 'Título',
    titlePlaceholder: 'Digite o título',
    totalPages: 'Páginas totais',
    dailyNorm: 'Meta diária',
    save: 'Salvar',
    cancel: 'Cancelar',
    todayHint: 'ir para hoje',
    noBook: 'Sem livro',
    calendarSub: (left, norm) => `${left} págs. restantes | Meta ${norm} págs.`,
    futureClosed: 'Dias futuros bloqueados',
    pagesQuestion: 'Quantas páginas você leu?',
    congrats: 'Parabéns, livro concluído!',
    backToLibrary: 'Voltar à biblioteca',
    language: 'Idioma',
    theme: 'Tema',
    light: 'Claro',
    dark: 'Escuro',
    appSettings: 'Configurações do app',
    settingsHint: 'Escolha o idioma e o tema. As configurações são salvas automaticamente.',
    error: 'Erro',
    loadError: 'Não foi possível carregar os livros',
    saveError: 'Não foi possível salvar as alterações',
    fillFields: 'Preencha todos os campos',
    enterNumbers: 'Digite números maiores que zero',
    deleteTitle: 'Excluir',
    deleteMessage: 'Excluir este livro da biblioteca?',
    delete: 'Excluir',
  },
  pl: {
    months: ['STYCZEŃ', 'LUTY', 'MARZEC', 'KWIECIEŃ', 'MAJ', 'CZERWIEC', 'LIPIEC', 'SIERPIEŃ', 'WRZESIEŃ', 'PAŹDZIERNIK', 'LISTOPAD', 'GRUDZIEŃ'],
    days: ['ND', 'PN', 'WT', 'ŚR', 'CZW', 'PT', 'SOB'],
    brand: 'My Book Tracker',
    library: 'Biblioteka',
    settings: 'Ustawienia',
    emptyTitle: 'Brak książek',
    emptyText: 'Dodaj pierwszą książkę i śledź postępy dzień po dniu.',
    addBook: '+ Nowa książka',
    bookFinished: 'Książka ukończona',
    leftOfTotal: (left, total) => `Pozostało ${left} stron z ${total}`,
    addMode: 'Dodawanie',
    editMode: 'Edycja',
    newBook: 'Nowa książka',
    editBook: 'Edytuj książkę',
    title: 'Tytuł',
    titlePlaceholder: 'Wpisz tytuł książki',
    totalPages: 'Liczba stron',
    dailyNorm: 'Dzienny cel',
    save: 'Zapisz',
    cancel: 'Anuluj',
    todayHint: 'przejdź do dzisiaj',
    noBook: 'Brak książki',
    calendarSub: (left, norm) => `Pozostało ${left} str. | Cel ${norm} str.`,
    futureClosed: 'Przyszłe dni są zablokowane',
    pagesQuestion: 'Ile stron przeczytałeś?',
    congrats: 'Gratulacje, książka ukończona!',
    backToLibrary: 'Wróć do biblioteki',
    language: 'Język',
    theme: 'Motyw',
    light: 'Jasny',
    dark: 'Ciemny',
    appSettings: 'Ustawienia aplikacji',
    settingsHint: 'Wybierz język i motyw. Ustawienia są zapisywane automatycznie.',
    error: 'Błąd',
    loadError: 'Nie udało się załadować książek',
    saveError: 'Nie udało się zapisać zmian',
    fillFields: 'Wypełnij wszystkie pola',
    enterNumbers: 'Wprowadź liczby większe od zera',
    deleteTitle: 'Usuń',
    deleteMessage: 'Usunąć tę książkę z biblioteki?',
    delete: 'Usuń',
  },
  tr: {
    months: ['OCAK', 'ŞUBAT', 'MART', 'NİSAN', 'MAYIS', 'HAZİRAN', 'TEMMUZ', 'AĞUSTOS', 'EYLÜL', 'EKİM', 'KASIM', 'ARALIK'],
    days: ['PAZ', 'PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT'],
    brand: 'My Book Tracker',
    library: 'Kitaplık',
    settings: 'Ayarlar',
    emptyTitle: 'Henüz kitap yok',
    emptyText: 'İlk kitabını ekle ve günlük ilerlemeni takip et.',
    addBook: '+ Yeni kitap',
    bookFinished: 'Kitap bitti',
    leftOfTotal: (left, total) => `${total} sayfadan ${left} sayfa kaldı`,
    addMode: 'Ekleniyor',
    editMode: 'Düzenleniyor',
    newBook: 'Yeni kitap',
    editBook: 'Kitabı düzenle',
    title: 'Başlık',
    titlePlaceholder: 'Kitap başlığını gir',
    totalPages: 'Toplam sayfa',
    dailyNorm: 'Günlük hedef',
    save: 'Kaydet',
    cancel: 'İptal',
    todayHint: 'bugüne git',
    noBook: 'Kitap yok',
    calendarSub: (left, norm) => `${left} sayfa kaldı | Hedef ${norm} sayfa`,
    futureClosed: 'Gelecek günler kilitli',
    pagesQuestion: 'Bugün kaç sayfa okudun?',
    congrats: 'Tebrikler, kitabı bitirdin!',
    backToLibrary: 'Kitaplığa dön',
    language: 'Dil',
    theme: 'Tema',
    light: 'Açık',
    dark: 'Koyu',
    appSettings: 'Uygulama ayarları',
    settingsHint: 'Dil ve temayı seç. Ayarlar otomatik kaydedilir.',
    error: 'Hata',
    loadError: 'Kitaplar yüklenemedi',
    saveError: 'Değişiklikler kaydedilemedi',
    fillFields: 'Tüm alanları doldur',
    enterNumbers: 'Sıfırdan büyük sayılar gir',
    deleteTitle: 'Sil',
    deleteMessage: 'Bu kitabı kitaplıktan sil?',
    delete: 'Sil',
  },
    nl: {
    months: ['JANUARI', 'FEBRUARI', 'MAART', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AUGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DECEMBER'],
    days: ['ZO', 'MA', 'DI', 'WO', 'DO', 'VR', 'ZA'],
    brand: 'My Book Tracker',
    library: 'Bibliotheek',
    settings: 'Instellingen',
    emptyTitle: 'Nog geen boeken',
    emptyText: 'Voeg je eerste boek toe en volg de voortgang per dag.',
    addBook: '+ Nieuw boek',
    bookFinished: 'Boek uit',
    leftOfTotal: (left, total) => `${left} pagina's over van ${total}`,
    addMode: 'Toevoegen',
    editMode: 'Bewerken',
    newBook: 'Nieuw boek',
    editBook: 'Bewerk boek',
    title: 'Titel',
    titlePlaceholder: 'Voer de titel in',
    totalPages: 'Totaal pagina\'s',
    dailyNorm: 'Dagelijks doel',
    save: 'Opslaan',
    cancel: 'Annuleren',
    todayHint: 'naar vandaag',
    noBook: 'Geen boek',
    calendarSub: (left, norm) => `${left} pagina's over | Doel ${norm}`,
    futureClosed: 'Toekomstige dagen zijn gesloten',
    pagesQuestion: 'Hoeveel pagina\'s heb je gelezen?',
    congrats: 'Gefeliciteerd, boek uit!',
    backToLibrary: 'Terug naar bibliotheek',
    language: 'Taal',
    theme: 'Thema',
    light: 'Licht',
    dark: 'Donker',
    appSettings: 'App-instellingen',
    settingsHint: 'Kies taal en thema. Instellingen worden automatisch opgeslagen.',
    error: 'Fout',
    loadError: 'Kon boeken niet laden',
    saveError: 'Kon wijzigingen niet opslaan',
    fillFields: 'Vul alle velden in',
    enterNumbers: 'Voer getallen groter dan nul in',
    deleteTitle: 'Verwijderen',
    deleteMessage: 'Dit boek verwijderen uit de bibliotheek?',
    delete: 'Verwijder',
  },
  sv: {
    months: ['JANUARI', 'FEBRUARI', 'MARS', 'APRIL', 'MAJ', 'JUNI', 'JULI', 'AUGUSTI', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DECEMBER'],
    days: ['SÖ', 'MÅ', 'TI', 'ON', 'TO', 'FR', 'LÖ'],
    brand: 'My Book Tracker',
    library: 'Bibliotek',
    settings: 'Inställningar',
    emptyTitle: 'Inga böcker än',
    emptyText: 'Lägg till din första bok och följ framstegen dag för dag.',
    addBook: '+ Ny bok',
    bookFinished: 'Boken färdig',
    leftOfTotal: (left, total) => `${left} sidor kvar av ${total}`,
    addMode: 'Lägger till',
    editMode: 'Redigerar',
    newBook: 'Ny bok',
    editBook: 'Redigera bok',
    title: 'Titel',
    titlePlaceholder: 'Ange bokens titel',
    totalPages: 'Totalt antal sidor',
    dailyNorm: 'Dagligt mål',
    save: 'Spara',
    cancel: 'Avbryt',
    todayHint: 'gå till idag',
    noBook: 'Ingen bok',
    calendarSub: (left, norm) => `${left} sidor kvar | Mål ${norm} sidor`,
    futureClosed: 'Framtida dagar är låsta',
    pagesQuestion: 'Hur många sidor läste du?',
    congrats: 'Grattis, boken är färdigläst!',
    backToLibrary: 'Tillbaka till biblioteket',
    language: 'Språk',
    theme: 'Tema',
    light: 'Ljust',
    dark: 'Mörkt',
    appSettings: 'Appinställningar',
    settingsHint: 'Välj språk och tema. Inställningarna sparas automatiskt.',
    error: 'Fel',
    loadError: 'Kunde inte ladda böcker',
    saveError: 'Kunde inte spara ändringar',
    fillFields: 'Fyll i alla fält',
    enterNumbers: 'Ange siffror större än noll',
    deleteTitle: 'Radera',
    deleteMessage: 'Radera den här boken från biblioteket?',
    delete: 'Radera',
  },
  ar: {
    months: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    days: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    brand: 'My Book Tracker',
    library: 'المكتبة',
    settings: 'الإعدادات',
    emptyTitle: 'لا توجد كتب',
    emptyText: 'أضف كتابك الأول وتتبع التقدم يومًا بيوم.',
    addBook: '+ كتاب جديد',
    bookFinished: 'تم إكمال الكتاب',
    leftOfTotal: (left, total) => `${left} صفحة متبقية من ${total}`,
    addMode: 'إضافة',
    editMode: 'تعديل',
    newBook: 'كتاب جديد',
    editBook: 'تعديل الكتاب',
    title: 'العنوان',
    titlePlaceholder: 'أدخل عنوان الكتاب',
    totalPages: 'إجمالي الصفحات',
    dailyNorm: 'الهدف اليومي',
    save: 'حفظ',
    cancel: 'إلغاء',
    todayHint: 'اذهب إلى اليوم',
    noBook: 'لا يوجد كتاب',
    calendarSub: (left, norm) => `${left} صفحة متبقية | الهدف ${norm} صفحة`,
    futureClosed: 'الأيام المستقبلية مغلقة',
    pagesQuestion: 'كم صفحة قرأت؟',
    congrats: 'تهانينا، لقد أكملت الكتاب!',
    backToLibrary: 'العودة إلى المكتبة',
    language: 'اللغة',
    theme: 'المظهر',
    light: 'فاتح',
    dark: 'داكن',
    appSettings: 'إعدادات التطبيق',
    settingsHint: 'اختر اللغة والمظهر. يتم حفظ الإعدادات تلقائيًا.',
    error: 'خطأ',
    loadError: 'فشل تحميل الكتب',
    saveError: 'فشل حفظ التغييرات',
    fillFields: 'املأ جميع الحقول',
    enterNumbers: 'أدخل أرقامًا أكبر من الصفر',
    deleteTitle: 'حذف',
    deleteMessage: 'هل تريد حذف هذا الكتاب من المكتبة؟',
    delete: 'حذف',
  },
  ja: {
    months: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
    days: ['日', '月', '火', '水', '木', '金', '土'],
    brand: 'My Book Tracker',
    library: 'ライブラリ',
    settings: '設定',
    emptyTitle: '本がありません',
    emptyText: '最初の本を追加して、日々の進捗を記録しましょう。',
    addBook: '+ 新しい本',
    bookFinished: '読了',
    leftOfTotal: (left, total) => `残り${left}ページ（全${total}ページ）`,
    addMode: '追加中',
    editMode: '編集中',
    newBook: '新しい本',
    editBook: '本を編集',
    title: 'タイトル',
    titlePlaceholder: 'タイトルを入力',
    totalPages: '総ページ数',
    dailyNorm: '1日の目標',
    save: '保存',
    cancel: 'キャンセル',
    todayHint: '今日に戻る',
    noBook: '本がありません',
    calendarSub: (left, norm) => `残り${left}ページ | 目標${norm}ページ`,
    futureClosed: '未来の日付はロックされています',
    pagesQuestion: '何ページ読みましたか？',
    congrats: 'おめでとうございます、本を読み終えました！',
    backToLibrary: 'ライブラリに戻る',
    language: '言語',
    theme: 'テーマ',
    light: 'ライト',
    dark: 'ダーク',
    appSettings: 'アプリ設定',
    settingsHint: '言語とテーマを選択してください。設定は自動的に保存されます。',
    error: 'エラー',
    loadError: '本を読み込めませんでした',
    saveError: '変更を保存できませんでした',
    fillFields: 'すべてのフィールドを入力してください',
    enterNumbers: 'ゼロより大きい数値を入力してください',
    deleteTitle: '削除',
    deleteMessage: 'この本をライブラリから削除しますか？',
    delete: '削除',
  },
  ko: {
    months: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'],
    days: ['일', '월', '화', '수', '목', '금', '토'],
    brand: 'My Book Tracker',
    library: '라이브러리',
    settings: '설정',
    emptyTitle: '책이 없습니다',
    emptyText: '첫 번째 책을 추가하고 날짜별 진행 상황을 기록하세요.',
    addBook: '+ 새 책',
    bookFinished: '책 완독',
    leftOfTotal: (left, total) => `총 ${total}페이지 중 ${left}페이지 남음`,
    addMode: '추가 중',
    editMode: '편집 중',
    newBook: '새 책',
    editBook: '책 편집',
    title: '제목',
    titlePlaceholder: '책 제목 입력',
    totalPages: '전체 페이지',
    dailyNorm: '일일 목표',
    save: '저장',
    cancel: '취소',
    todayHint: '오늘로 이동',
    noBook: '책 없음',
    calendarSub: (left, norm) => `${left}페이지 남음 | 목표 ${norm}페이지`,
    futureClosed: '미래 날짜는 잠겨 있습니다',
    pagesQuestion: '몇 페이지 읽었나요?',
    congrats: '축하합니다! 책을 다 읽었습니다!',
    backToLibrary: '라이브러리로 돌아가기',
    language: '언어',
    theme: '테마',
    light: '라이트',
    dark: '다크',
    appSettings: '앱 설정',
    settingsHint: '언어와 테마를 선택하세요. 설정은 자동으로 저장됩니다.',
    error: '오류',
    loadError: '책을 불러올 수 없습니다',
    saveError: '변경 사항을 저장할 수 없습니다',
    fillFields: '모든 필드를 입력하세요',
    enterNumbers: '0보다 큰 숫자를 입력하세요',
    deleteTitle: '삭제',
    deleteMessage: '이 책을 라이브러리에서 삭제하시겠습니까?',
    delete: '삭제',
  },
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
