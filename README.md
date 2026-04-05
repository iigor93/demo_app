# Demo App

Мобильное приложение на Expo + React Native + TypeScript с файловой навигацией через `expo-router`.

Сейчас в проекте есть:
- экран новостей с баннерами и списком новостей
- экран деталей новости
- экран карты с точками, загружаемыми с бэкенда
- экран внутренних логов приложения
- вспомогательный demo-экран

## Стек

- Expo SDK 54
- React 19
- React Native 0.81
- TypeScript
- expo-router
- expo-image
- react-native-maps

## Запуск проекта

1. Установить зависимости:

```bash
npm install
```

2. Указать API-базу в `.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://YOUR_BACKEND_URL
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

## API, которые использует приложение

- `GET /api/v1/banners`
- `GET /api/v1/news`
- `GET /api/v1/coordinates`

Ожидаемый формат координат:

```json
[
  {
    "lat": 33,
    "lon": 43,
    "name": "Point name",
    "description": "Point description"
  }
]
```

Если `id` не приходит, клиент сгенерирует его сам по индексу элемента.

## Карта

Экран карты доступен отдельной кнопкой в нижнем tab bar.

Поведение карты:
- точки загружаются при старте приложения
- на карте отображаются маркеры по `lat/lon`
- по нажатию на маркер открывается карточка с названием и описанием точки
- по нажатию на свободную область карты карточка скрывается
- есть ручная кнопка обновления точек

## Структура проекта

- `app/_layout.tsx` — корневой layout и ранняя загрузка координат
- `app/(tabs)/_layout.tsx` — нижние табы приложения
- `app/(tabs)/index.tsx` — главный экран новостей
- `app/(tabs)/map.tsx` — экран карты
- `app/(tabs)/logs.tsx` — экран логов
- `app/news/[id].tsx` — экран деталей новости
- `services/api.ts` — API-слой
- `services/coordinates-store.ts` — store координат карты
- `services/logs.ts` — in-memory логгер
- `services/global-banner.ts` — глобальный banner ошибок

## Полезные команды

```bash
npm run lint
npm run reset-project
```

## Примечания

- Для API используется переменная окружения `EXPO_PUBLIC_API_BASE_URL`.
- Ошибки запросов логируются и показываются через глобальный banner.
- Детали новости открываются без повторного API-запроса, через параметры навигации.
