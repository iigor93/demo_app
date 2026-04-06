# Demo App

Мобильное приложение на Expo + React Native + TypeScript с файловой навигацией через `expo-router`.

Сейчас в проекте есть:
- экран новостей с баннерами и списком новостей
- экран деталей новости
- экран карты с точками, загружаемыми с backend
- экран внутренних логов приложения
- вспомогательный demo-экран

## Стек

- Expo SDK 54
- React 19
- React Native 0.81
- TypeScript
- expo-router
- expo-image
- expo-clipboard
- react-native-webview
- OpenStreetMap + Leaflet внутри `WebView`

## Запуск проекта

1. Установить зависимости:

```bash
npm install
```

2. Указать API-базу в `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=https://your-backend.example.com
```

3. Запустить приложение:

```bash
npx expo start
```

Дополнительно:

```bash
npm run android
npm run ios
npm run web
```

Если нужно очистить кэш Metro:

```bash
npx expo start --clear
```

## API, которые использует приложение

- `GET /api/v1/banners`
- `GET /api/v1/news`
- `GET /api/v1/coordinates`

Ожидаемый формат координат:

```json
[
  {
    "id": "1",
    "lat": 55.75,
    "lon": 37.61,
    "name": "Point name",
    "description": "Point description"
  }
]
```

Если `id` не приходит, клиент сгенерирует его сам по индексу элемента.

## Карта

Экран карты доступен отдельной кнопкой в нижнем tab bar.

Поведение карты:
- точки загружаются после первичных UI interactions
- карта построена на `OpenStreetMap`
- рендер карты идет через `Leaflet` внутри `react-native-webview`
- по нажатию на маркер открывается карточка с названием и описанием точки
- по нажатию на свободную область карты карточка скрывается
- есть ручная кнопка обновления точек

Важно:
- для работы карты устройству нужен доступ к `unpkg.com`
- для загрузки тайлов нужен доступ к `tile.openstreetmap.org`

## Сеть и ошибки

- Для API используется переменная окружения `EXPO_PUBLIC_API_BASE_URL`
- В `services/api.ts` все GET-запросы идут через `expo/fetch`
- Таймаут сетевого запроса: `15s`
- Для transient network-ошибок есть одна повторная попытка
- Ошибки запросов логируются и показываются через глобальный banner

## Структура проекта

- `app/_layout.tsx` - корневой layout, `StatusBar`, ранняя загрузка координат
- `app/(tabs)/_layout.tsx` - нижние табы приложения
- `app/(tabs)/index.tsx` - главный экран новостей
- `app/(tabs)/map.tsx` - экран карты
- `app/(tabs)/logs.tsx` - экран логов
- `app/news/[id].tsx` - экран деталей новости
- `services/api.ts` - API-слой
- `services/coordinates-store.ts` - store координат карты
- `services/logs.ts` - in-memory логгер
- `services/global-banner.ts` - глобальный banner ошибок
- `app_description.md` - расширенное описание проекта и release-памятка

## Полезные команды

```bash
npm run lint
npx tsc --noEmit
npm run reset-project
```

## Сборка APK через EAS

В проекте уже настроен `eas.json` с профилем `preview` для Android APK.

Проверить логин:

```bash
npx eas whoami
```

Если нужно войти:

```bash
npx eas login
```

Проверить переменные окружения для `preview`:

```bash
npx eas env:list --environment preview
```

Собрать APK:

```bash
npx eas build --platform android --profile preview
```

Текущая логика профиля `preview`:
- `distribution: internal`
- `environment: preview`
- `android.buildType: apk`
- `autoIncrement: true`

## Версионирование перед новой сборкой

Перед новой сборкой после изменений нужно поднять версию в двух местах:
- `app.json` -> `expo.version`
- `package.json` -> `version`

Например:
- `1.0.1` -> `1.0.2`

## Примечания

- Экран карты больше не зависит от Google Maps SDK и billing в Google Cloud
- Детали новости открываются без повторного API-запроса, через параметры навигации
- Если что-то пошло не так, сначала стоит проверить `Logs` внутри приложения и `GlobalErrorBanner`
