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


## Публичная ссылка (чтобы игроки просто открывали в браузере)

Проект готов к автодеплою на **GitHub Pages** через workflow:
- `.github/workflows/deploy-pages.yml`

Что нужно сделать один раз в GitHub:
1. Откройте репозиторий → **Settings** → **Pages**.
2. В разделе **Build and deployment** выберите **GitHub Actions**.
3. Запушьте изменения в ветку `main`.
4. После успешного workflow получите публичную ссылку вида:
   - `https://<username>.github.io/<repo>/`

После этого пользователи смогут запускать игру просто по ссылке в браузере, без установки Node.js и без локального запуска.

---


## Кастомный домен (magictollan.com)

Для GitHub Pages уже добавлен файл `public/CNAME`, поэтому после деплоя Pages будет запрашивать домен `magictollan.com`.

Что нужно сделать в DNS у регистратора домена:

1. Для apex-домена `magictollan.com` добавьте A-записи:
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
2. (Опционально) для `www.magictollan.com` добавьте CNAME на `<username>.github.io`.
3. В GitHub: **Settings → Pages** проверьте, что Custom domain = `magictollan.com` и включите **Enforce HTTPS**.

После обновления DNS игра будет открываться по кастомной ссылке в браузере.

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
