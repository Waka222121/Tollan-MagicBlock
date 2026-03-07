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
npm run dev
```
Откройте адрес из консоли (обычно `http://localhost:5173`).

### 6) Production build
```bash
npm run build
npm run preview
```

---

## Notes
- Node.js 18+ рекомендуется.
- Если `npm run check:assets` показывает `WARN` про `unused remainder`, это не всегда критичная ошибка, но значит в спрайтшите есть незадействованная область.
