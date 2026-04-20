# Demo App: краткое описание проекта

## Что это за приложение
- Мобильное приложение на Expo + React Native + TypeScript.
- Навигация построена на `expo-router` с файловыми маршрутами.
- В приложении есть экран новостей, экран деталей новости, demo-экран, экран логов и экран карты с точками.

## Технологический стек
- Expo SDK 54
- React 19
- React Native 0.81
- TypeScript
- `expo-router`
- `expo-image`
- `expo-clipboard`
- `react-native-safe-area-context`
- `@react-native-community/datetimepicker`
- `react-native-webview`
- OpenStreetMap + Leaflet внутри `WebView`
- CARTO raster tiles style `rastertiles/voyager`

## Структура маршрутов
- `app/_layout.tsx`
  Корневой layout. Подключает `SafeAreaProvider`, корневой `Stack`, `GlobalErrorBanner`, настраивает `StatusBar` и запускает отложенную предзагрузку координат карты через `InteractionManager.runAfterInteractions`.
- `app/(tabs)/_layout.tsx`
  Нижние табы приложения.
  Сейчас есть 4 вкладки:
  - `index`: новости
  - `explore`: второй экран новостей в темном стиле
  - `map`: карта с точками
  - `logs`: просмотр внутренних логов
- `app/(tabs)/index.tsx`
  Главный экран. Загружает баннеры и новости с API, поддерживает pull-to-refresh.
- `app/(tabs)/explore.tsx`
  Второй экран новостей в темном стиле.
  Что делает:
  - загружает новости с API через `fetchNews()`
  - поддерживает pull-to-refresh
  - открывает экран деталей новости по нажатию
  - не показывает верхние баннеры
  - рендерит темный header с кнопкой назад и заголовком `Новости`
  - показывает skeleton-карточки во время загрузки
  - использует светлый `StatusBar`
- `app/(tabs)/map.tsx`
  Экран карты. Показывает карту OpenStreetMap через `react-native-webview`, использует Leaflet и CARTO raster tiles style `rastertiles/voyager`, размещает точки по координатам, открывает карточку выбранной точки и позволяет вручную обновить точки.
- `app/(tabs)/logs.tsx`
  Экран просмотра внутренних логов приложения. Показывает только ошибки и умеет копировать текст конкретной записи в буфер обмена.
- `app/news/[id].tsx`
  Экран деталей новости в темном стиле. Получает данные через `router params`, без отдельного API-запроса.
  Что делает:
  - показывает большую верхнюю картинку, если у новости есть `image`
  - корректно работает и без картинки
  - показывает крупный заголовок и текстовый блок `Условия`
  - показывает красную нижнюю кнопку `#ED3237`
  - открывает нижнее модальное окно в темном стиле
  - закрывает модальное окно по кнопке и по тапу вне окна
  - использует собственный `Stack.Screen` с `headerShown: false`

## Основной поток данных
1. При старте приложения `app/_layout.tsx` планирует загрузку координат карты после завершения первичных UI interactions.
2. Главный экран вызывает `loadData()` и параллельно получает баннеры и новости через `Promise.allSettled`.
3. Сетевые функции лежат в `services/api.ts`.
4. Координаты карты живут в отдельном легковесном store `services/coordinates-store.ts`.
5. При успешном ответе данные попадают либо в локальный state экрана, либо в store.
6. При ошибках пишется подробный error-лог и показывается глобальный верхний banner о технических проблемах.
7. Экран деталей новости получает данные без повторного API-запроса через параметры навигации из списка новостей.

## Слой сервисов

### `services/api.ts`
Центральная точка работы с API.

Что делает generic-функция `get<T>(path)`:
- собирает URL из `EXPO_PUBLIC_API_BASE_URL` и `path`
- делает GET-запрос через `expo/fetch`
- ставит явный timeout `15s`
- делает одну повторную попытку для transient network-ошибок
- читает `response.text()`
- пытается распарсить JSON, а если не получается, сохраняет текст как есть
- при `!response.ok` пишет подробный error-лог и бросает ошибку
- при сетевом исключении пишет расширенный error-лог, показывает глобальный banner и пробрасывает ошибку дальше

Экспортирует:
- `fetchBanners()` -> `GET /api/v1/banners`
- `fetchNews()` -> `GET /api/v1/news`
- `fetchCoordinates()` -> `GET /api/v1/coordinates`

Типы данных:
- `Banner`: `{ id, image }`
- `NewsItem`: `{ id, name, description, image, updated_at }`
- `CoordinatePoint`: `{ id, lat, lon, name, description }`

### Что теперь есть в сетевых error-логах
- `requestId`
- `path`, `url`, `baseUrl`
- `startedAt`, `lastAttemptStartedAt`, `durationMs`
- `attempt`, `attemptsMade`, `maxAttempts`, `attemptDurationsMs`
- `timeoutMs`, `didTimeout`, `retryApplied`
- `platform`
- `origin`, `host`, `hostname`, `protocol`, `port`
- `concurrentRequests`
- `probableCauses`
- `mostLikelyCause`
- `mostLikelyCauseRu`
- `summaryRu`
- `name`, `message`, `stack`

Это нужно, чтобы лучше диагностировать случаи вроде `Network request failed`, когда backend не видит запроса и ответ вообще не был получен.

### `services/coordinates-store.ts`
Легковесный store координат карты на модульной переменной + `useSyncExternalStore`.

Отвечает за:
- хранение точек
- флаг загрузки
- флаг первичной успешной загрузки
- `loadCoordinates(force?)`
- `useCoordinates()`

### `services/logs.ts`
In-memory логгер без внешнего хранилища.

Важно:
- хранит только `error`-записи
- успешные события и действия пользователя не логируются

### `services/global-banner.ts`
Глобальное хранилище состояния для верхнего banner уведомлений.

## Поведение карты
- Точки карты загружаются с backend не мгновенно на самом старте, а после первичных UI interactions.
- Карта построена на `OpenStreetMap` и `Leaflet`, которые рендерятся внутри `WebView`.
- Leaflet подключается по сети с `unpkg.com`.
- Подложка карты загружается с `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png`.
- Атрибуция карты показывает `OpenMapTiles` и `OpenStreetMap contributors`.
- По нажатию на маркер показывается карточка с `name` и `description`.
- По нажатию на свободную область карты карточка скрывается.
- Экран карты умеет:
  - показывать состояние загрузки
  - показывать пустое состояние, если точек нет
  - вручную обновлять точки кнопкой
  - центрировать карту по пришедшим координатам

## Логи
- Экран логов: `app/(tabs)/logs.tsx`
- В логах остаются только ошибки.
- Для каждой записи есть кнопка копирования текста, чтобы не пересылать скриншоты.

## Практический вывод по нестабильным запросам
- Если браузер на том же устройстве ходит в API стабильно, а приложение иногда получает `Network request failed`, текущее основное подозрение:
  - мобильный сетевой стек приложения
  - transient HTTPS/TLS проблема до backend
  - стартовая конкуренция запросов
  - нестабильность соединения на уровне app runtime, а не самого backend

## Компоненты
- `components/BannerCarousel.tsx`
  Горизонтальная карусель баннеров.
- `components/GlobalErrorBanner.tsx`
  Глобальный верхний banner ошибки, рендерится один раз в корневом layout.

## Зависимости от окружения
- В `services/api.ts` используется `EXPO_PUBLIC_API_BASE_URL`.
- `BASE_URL` нормализуется удалением завершающего `/`.
- Для экрана карты нужен доступ устройства к `unpkg.com` и `basemaps.cartocdn.com`, иначе карта не отрисуется даже при рабочем backend API.

## Архитектурные особенности
- Это не Redux/Zustand/MobX-приложение.
- Глобальные данные реализованы легко через модульные переменные и `useSyncExternalStore`.
- Экран деталей новости не делает собственный API-запрос.
- Главный экран специально использует `Promise.allSettled`, чтобы отказ одного запроса не ломал второй.
- Сетевые сбои можно показывать из любого места через `services/global-banner.ts`.
- Карта больше не зависит от Google Maps SDK и billing в Google Cloud.
- `Экран 2` больше не demo-площадка, а отдельный темный экран новостей.
- Для темных экранов новости и деталей используется светлый `StatusBar`.
- Чтобы убрать белые вспышки при переходах между темными экранами, в `app.json` задан `expo.backgroundColor = "#111111"`.
- Дополнительно корневой layout задает темный background окна приложения через `expo-system-ui`.
- У корневого `Stack`, `Tabs` и экрана `app/news/[id].tsx` задан темный background навигационных контейнеров.

## Практические заметки для новой сессии
Разбор проекта лучше начинать с:
1. `app/_layout.tsx`
2. `app/(tabs)/_layout.tsx`
3. `app/(tabs)/index.tsx`
4. `app/(tabs)/explore.tsx`
5. `app/(tabs)/map.tsx`
6. `services/api.ts`
7. `services/coordinates-store.ts`
8. `services/logs.ts`
9. `services/global-banner.ts`

Если что-то не грузится, сначала проверить:
- задан ли `EXPO_PUBLIC_API_BASE_URL`
- что возвращают `/api/v1/banners`, `/api/v1/news`, `/api/v1/coordinates`
- не показывается ли `GlobalErrorBanner`
- что пишется во вкладке `Logs`
- есть ли доступ к `unpkg.com` и `basemaps.cartocdn.com`
- какие `mostLikelyCauseRu` и `summaryRu` попали в error-лог

Если не работает новый темный экран новостей или детали новости, проверить:
- открывается ли `app/(tabs)/explore.tsx`
- приходят ли `name`, `description`, `image`, `updated_at` в `router params`
- не перекрывает ли системный header кастомный layout
- не сломан ли светлый `StatusBar` на темных экранах
- не переопределился ли темный background у `Stack`/`Tabs`/`SystemUI`

## Сборка APK через Expo EAS
- Проект уже подключен к EAS Build и использует `eas.json`.
- Для Android preview-сборки настроен профиль `preview` со следующей логикой:
  - `distribution: "internal"`
  - `environment: "preview"`
  - `android.buildType: "apk"`
  - `autoIncrement: true`
- В `eas.json` используется `cli.appVersionSource: "remote"`.

Команда сборки APK:
```bash
npx eas build --platform android --profile preview
```

## Версионирование перед релизом
- User-facing версия хранится в двух местах:
  - `app.json` -> `expo.version`
  - `package.json` -> `version`
- Текущая зафиксированная версия проекта: `1.0.1`.
- Перед каждой новой сборкой после изменений нужно поднимать обе user-facing версии, например:
  - `1.0.1` -> `1.0.2`

## Что проверить перед облачной сборкой
- Все нужные изменения внесены в код и конфиги.
- Актуальная версия указана в `app.json` и `package.json`.
- Для нужного EAS environment доступна переменная `EXPO_PUBLIC_API_BASE_URL`.
- Конфиг корректно читается через `npx expo config --json`.
- При необходимости можно прогнать `npm run lint`.
- При необходимости можно прогнать `npx tsc --noEmit`.

## Что не хранить в этом файле
- Логины аккаунтов
- Пароли
- Токены
- Секретные ключи
- Закрытые значения переменных окружения
- Любые другие чувствительные данные

## Допустимо хранить в этом файле
- Общие инструкции по релизу
- Имена команд
- Имена переменных окружения без их секретных значений
- Описание текущей схемы сборки и версионирования

## Актуальность описания
- Описание актуализировано по состоянию на 2026-04-20.
- Если меняются табы, маршруты, API-методы, формат данных, глобальные сервисы, demo-экран или процесс релиза, этот файл нужно обновлять в рамках той же задачи.
- Если в `app_description.md` добавляются новые важные изменения или заметки, это же нужно отражать и в `README.md`, чтобы краткое и расширенное описания не расходились.
