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
 codex/check-models-and-textures-for-bugs-ochy6m
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

Создайте файл `.env.local` и укажите ключ Gemini:
```bash
GEMINI_API_KEY=your_key_here
```

### 4) Проверка ассетов (моделей/текстур)
Перед запуском рекомендуется прогнать валидацию спрайтшитов:
```bash
npm run check:assets
```

### 5) Запуск в режиме разработки
```bash
< codex/check-models-and-textures-for-bugs-k8e2bj
> main
# стандартный режим
npm run dev

# явный запуск для доступа по сети/в контейнере
npm run dev:host
```
<<< codex/check-models-and-textures-for-bugs-ochy6m

=
npm run dev
```
 codex/check-models-and-textures-for-bugs-32vj10
Откройте адрес из консоли (обычно `http://localhost:5173`).

> main
 main
Откройте адрес из консоли. В этом репозитории по умолчанию:
- локально: `http://localhost:3000/`
- по сети: `http://<ВАШ_IP>:3000/`

Если после шага 5 видите `ERR_CONNECTION_REFUSED`:
< codex/check-models-and-textures-for-bugs-ochy6m

 codex/check-models-and-textures-for-bugs-k8e2bj
> main
1. Проверьте, что в консоли после запуска есть строка `VITE ready` и адрес `http://localhost:3000/`.
2. Убедитесь, что открываете именно порт **3000** (а не 5173).
3. Для удалённой машины/контейнера используйте `npm run dev:host`, затем адрес из строки `Network`.
4. Проверьте, что порт 3000 не блокируется фаерволом/антивирусом.
5. Если порт занят, запустите на другом порту:
   ```bash
   npm run dev:host -- --port 4173
   ```
< codex/check-models-and-textures-for-bugs-ochy6m


1. Проверьте, что в консоли после `npm run dev` есть строка `VITE ready` и адрес `http://localhost:3000/`.
2. Убедитесь, что открываете именно порт **3000** (а не 5173).
3. Если запускаете проект на удалённой машине/сервере, открывайте адрес из строки `Network` (или пробросьте порт 3000).
4. Проверьте, что порт 3000 не блокируется фаерволом/антивирусом.
5. Перезапустите сервер:
   ```bash
   npm run dev
   ```
 main
>>>> main
> main

### 6) Production build
```bash
npm run build
npm run preview
```

---

## Notes
- Node.js 18+ рекомендуется.
- Если `npm run check:assets` показывает `WARN` про `unused remainder`, это не всегда критичная ошибка, но значит в спрайтшите есть незадействованная область.
