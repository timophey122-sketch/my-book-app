import { readFile, writeFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/i18n.ts', import.meta.url), 'utf8');
const listText = source.match(/export const LANGUAGES = (\[[\s\S]*?\]) as const;/)?.[1];
if (!listText) throw new Error('Language list not found');
const languages = JSON.parse(listText);
const keys = ['paper','midnight','forest','ocean','rose','lavender','mint','sand','charcoal','sky','coffee','grape','sunset','ice','ink'];
const english = ['Paper','Midnight','Forest','Ocean','Rose','Lavender','Mint','Sand','Charcoal','Sky','Coffee','Grape','Sunset','Ice','Ink'];
const russian = ['Бумага','Полночь','Лес','Океан','Роза','Лаванда','Мята','Песок','Графит','Небо','Кофе','Виноград','Закат','Лёд','Чернила'];
const output = {};
const customKeys = ['appSettings','settingsHint','background','addBook','editBook','titlePlaceholder','todayHint','selectedFuture','backToLibrary','bookCompleted','quizCreating','quizWait','quizError','next','finish','hint','passed','failed','result','retry','developerMode','developerSaved','exitDeveloper','developerPassword','unlock','wrongPassword','notificationsInfo','openNotificationSettings','review','question','of'];
const customEnglish = ['App settings','Choose interface language, theme and background. Settings are saved automatically.','App background','Add book','Edit book','Enter book title','Go to today','You can view this day, but pages can only be entered for today or past days.','Back to library','Book completed!','Creating the quiz','Please wait while book information is checked.','A reliable quiz could not be created for this title. Check the title and internet connection.','Next question','Finish test','Hint','Test passed!','Test not passed','Result','Try again','Developer mode','Developer mode is saved on this device.','Exit developer mode','Developer password','Unlock','Wrong password','Reading reminders are controlled by the device.','Notification settings','Leave a review','Question','of'];
const customRussian = ['Настройки приложения','Выберите язык, тему и фон. Настройки сохраняются автоматически.','Фон приложения','Добавить книгу','Изменить книгу','Введите название книги','К сегодняшнему дню','Этот день можно посмотреть, но вводить страницы можно только за сегодня или прошедшие дни.','Назад в библиотеку','Книга прочитана!','Создаётся тест','Подождите, проверяем сведения о книге.','Не удалось создать надёжный тест для этой книги. Проверьте название и интернет.','Следующий вопрос','Завершить тест','Подсказка','Тест пройден!','Тест не пройден','Результат','Попробовать снова','Режим разработчика','Режим разработчика сохранён на этом устройстве.','Выйти из режима разработчика','Пароль разработчика','Открыть','Неверный пароль','Напоминания о чтении управляются настройками устройства.','Настройки уведомлений','Оставить отзыв','Вопрос','из'];
const customOutput = {};

for (const [code] of languages) {
  let values = english;
  let customValues = customEnglish;
  if (code === 'ru') { values = russian; customValues = customRussian; }
  else if (code !== 'en') {
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${encodeURIComponent(code)}&dt=t&q=${encodeURIComponent([...english, ...customEnglish].join('\n'))}`);
    if (!response.ok) throw new Error(`${code}: ${response.status}`);
    const payload = await response.json();
    const translated = payload[0].map((part) => part[0] || '').join('').split('\n').map((part) => part.trim());
    if (translated.length === english.length + customEnglish.length) {
      values = translated.slice(0, english.length);
      customValues = translated.slice(english.length);
    }
  }
  output[code] = Object.fromEntries(keys.map((key, index) => [key, values[index]]));
  customOutput[code] = Object.fromEntries(customKeys.map((key, index) => [key, customValues[index]]));
  process.stdout.write(`${code} `);
}

await writeFile(new URL('../src/backgroundLabels.ts', import.meta.url), `export const BACKGROUND_LABELS: Record<string, Record<string, string>> = ${JSON.stringify(output, null, 2)};\n\nexport const CLASSIC_TEXT: Record<string, Record<string, string>> = ${JSON.stringify(customOutput, null, 2)};\n`, 'utf8');
console.log('\nDone');
