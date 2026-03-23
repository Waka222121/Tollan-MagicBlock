<div align="center">
  <img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Tollan MagicBlock

Аркадная игра на **React + Vite + Phaser**.

## Быстрый старт

### 1) Требования
- Node.js 18+
- npm 9+

### 2) Установка
```bash
npm install
```

### 3) Локальный запуск
```bash
npm run dev
```

По умолчанию Vite даст URL в консоли (обычно `http://localhost:5173`).

Для запуска в контейнере/по сети:
```bash
npm run dev:host
```

### 4) Production-сборка
```bash
npm run build
npm run preview
```

---

## Переменные окружения

Для AI-функций (если используются) создайте `.env.local`:
```bash
GEMINI_API_KEY=your_key_here
```

Для онлайн-таблицы лидеров (Supabase):
```bash
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
VITE_LEADERBOARD_TABLE=leaderboard_waves
```

Если Supabase не задан, leaderboard автоматически работает через локальный fallback (`localStorage`).

---

## Релизный чек-лист

Перед публичным релизом:
```bash
npm run check:merge-markers
npm run check:assets
npm run build
```

Рекомендуется дополнительно:
- проверить, что background ассеты находятся в `public/assets`
- открыть `npm run preview` и вручную проверить:
  - главное меню
  - старт игры
  - экран LEVEL_UP
  - GAMEOVER и возврат в меню
  - leaderboard (локальный и с Supabase)

---

## Архитектура

- `index.tsx` — точка входа React.
- `App.tsx` — состояние приложения и переключение экранов.
- `GameEngine.tsx` — инициализация Phaser и связь React ↔ Phaser.
- `game/` — игровая логика.
- `components/Hub.tsx` — главное меню.
- `components/GameUI.tsx` — HUD/пауза/level-up/gameover UI.
- `lib/leaderboardClient.ts` — клиент leaderboard (Supabase + local fallback).

---

## Полезные команды

```bash
npm run check:assets
npm run check:merge-markers
npm run create:enemy-entry
```
