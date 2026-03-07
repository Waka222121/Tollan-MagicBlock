<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Tollan MagicBlock

## Запуск обновлённого репозитория с GitHub

### 1) Клонирование
```bash
git clone <URL_ВАШЕГО_РЕПОЗИТОРИЯ>
cd Tollan-MagicBlock
```

### 2) Установка зависимостей
```bash
npm install
```

### 3) Настройка окружения
Скопируйте шаблон и укажите новый ключ Gemini:
```bash
cp .env.local.example .env.local
```

Откройте `.env.local` и вставьте ключ:
```bash
GEMINI_API_KEY=your_new_api_key_here
```

### 4) Проверка ассетов (моделей/текстур)
Перед запуском рекомендуется прогнать валидацию спрайтшитов:
```bash
npm run check:assets
```

### 5) Запуск в режиме разработки
```bash
# стандартный режим
npm run dev

# явный запуск для доступа по сети/в контейнере
npm run dev:host
```
Откройте адрес из консоли. В этом репозитории по умолчанию:
- локально: `http://localhost:3000/`
- по сети: `http://<ВАШ_IP>:3000/`

Если после шага 5 видите `ERR_CONNECTION_REFUSED`:
1. Проверьте, что в консоли после запуска есть строка `VITE ready` и адрес `http://localhost:3000/`.
2. Убедитесь, что открываете именно порт **3000** (а не 5173).
3. Для удалённой машины/контейнера используйте `npm run dev:host`, затем адрес из строки `Network`.
4. Проверьте, что порт 3000 не блокируется фаерволом/антивирусом.
5. Если порт занят, запустите на другом порту:
   ```bash
   npm run dev:host -- --port 4173
   ```

### 6) Production build
```bash
npm run build
npm run preview
```


## Notes
- Node.js 18+ рекомендуется.
- Если `npm run check:assets` показывает `WARN` про `unused remainder`, это не всегда критичная ошибка, но значит в спрайтшите есть незадействованная область.

## Архитектура проекта

### Основные слои
- `App.tsx`: роутинг экранов приложения (Hub, GameEngine, AI Terminal).
- `GameEngine.tsx`: жизненный цикл Phaser и синхронизация данных в React.
- `game/Game.ts`: основная игровая сцена Phaser.
- `game/GameManagers.ts`: ядро игровых менеджеров (игрок, враги, бой, лут).
- `components/`: UI-обвязка меню и HUD.
- `components/ai/`: AI-модули терминала (чат, forge, voice, media).
- `lib/aiClient.ts`: единая точка работы с Gemini-клиентом и ошибками.
- `scripts/check-model-texture-assets.mjs`: проверка размеров текстур и спрайтшитов.

### Поток данных
1. `index.tsx` монтирует `App`.
2. `App` создаёт `GameEngine` при переходе в игру.
3. `GameEngine` поднимает Phaser `Game` сцену.
4. Сцена отправляет состояние в React через `GameBridge.onSyncData`.
5. React рисует HUD через `GameUI`.

### Где что менять
- Геймплей, враги, волны: `game/Game.ts`, `game/GameManagers.ts`, `constants.ts`.
- Визуальные спрайты врагов: `game/EnemySpriteRegistry.ts` и `public/assets`.
- Интерфейс игры: `components/GameUI.tsx`, `components/Hub.tsx`.
- AI-функции: `components/ai/*` и `lib/aiClient.ts`.

## CI проверка
Рекомендуемый pipeline:
```bash
npm ci
npm run check:assets
npm run build
```
