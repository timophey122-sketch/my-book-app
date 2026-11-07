# My Book Tracker

Android production builds use `minSdkVersion 23` to preserve upgrades for existing Android 6 users, with `compileSdkVersion 36`, `targetSdkVersion 36`, and Android Build Tools `36.0.0`. Google Play automatic protection must remain disabled because it requires minSdk 24.

Первая, самостоятельная версия приложения My Book Tracker. Она хранится отдельно от `My Book Tracker Family` и использует другой Android package name, поэтому обе версии можно установить одновременно.

## Возможности

- локальная библиотека книг;
- календарь чтения с переходом между неделями;
- автоматическое сохранение прочитанных страниц;
- светлая и тёмная темы;
- 15 цветных фонов;
- компактный выбор из 50 языков;
- поддержка интерфейса справа налево;
- сохраняемый аккаунт разработчика (5 нажатий по надписи My Book Tracker, код `1410`);
- тест после завершения книги.

## Запуск

```powershell
pnpm install
pnpm start
```

Основной код находится в `App.js`, переводы — в `src/i18n.ts` и `src/backgroundLabels.ts`.
