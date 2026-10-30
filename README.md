# Emoji Maker — AI Emoji Generator (Wavespeed & Flux-Dev)

## Overview
**Emoji Maker** is a web application that generates unique 3D emoji from a text description. It combines the **Flux-Dev** model (via the Wavespeed API) with a modern full-stack architecture to provide a fast cycle of creating, storing and publishing visual content.

## Key features
* **Flux-Dev generation:** high-quality images via the [Wavespeed.ai](https://wavespeed.ai/) API.
* **Smart prompting:** automatic prompt enrichment to achieve a consistent "3D icon, centered, clean background" style.
* **Reliable downloads:** an `/api/download` route that works around CORS and CloudFront restrictions when saving files.
* **Social layer:** a public gallery with real-time likes.
* **Access control:** **Clerk** integration for authentication and a personal generation history.

## Technical components

### Generation module
Implemented in Next.js API routes and includes:
* **Long polling:** `pollWavespeedResult` with a 90-second timeout to wait until the image is ready.
* **Error handling:** validation of API statuses (401, 402, 429) with user-facing technical notifications.
* **Style injection:** every user prompt is brought to a single visual standard.

### Storage and database
* **Supabase (PostgreSQL):** stores generation metadata (prompts, relations, user IDs).
* **Host security:** trusted domains are validated in `isAllowedImageUrl` (Supabase, Wavespeed, CloudFront).
* **State management:** Zustand manages the gallery state and loading indicators.

### Quality and security
* **Traffic proxying:** images are downloaded through a server-side buffer so that downloads work reliably.
* **Client-side load check:** the image load status is verified on the client before rendering.
* **UI optimisation:** a responsive Tailwind CSS grid with skeleton loaders.

## System architecture
The system follows a pipeline architecture:
1. **Input:** text prompt processing → adding style modifiers.
2. **Generation:** POST request to Wavespeed → polling the task status.
3. **Persistence:** saving the URL to Supabase → linking it to the Clerk session.
4. **Delivery:** display in the gallery grid → proxied download.

## Requirements
* Python 3.x (for processing scripts) / Node.js 18.x
* Active API keys:
    * **Wavespeed AI**
    * **Clerk**
    * **Supabase**

## Installation

1. **Clone the repository:**
```bash
   git clone https://github.com/darialiapun/emoji-maker.git
   cd emoji-maker
```

2. **Install dependencies:**
```bash
   npm install
```

3. **Configure the environment:**
   Create a `.env.local` file in the project root and add the following keys:
```
   WAVESPEED_API_KEY=your_key_here
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
   CLERK_SECRET_KEY=your_clerk_secret
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Start the development server:**
```bash
   npm run dev
```

## How to use

1. **Sign in:** log in via the Clerk widget (the Sign In button).
2. **Enter a prompt:** type a short description of the image you want (e.g. "neon cyberpunk cat").
3. **Generate:** click Generate. The system starts the generation via Wavespeed AI.
4. **Wait:** wait for it to finish (the status updates in real time thanks to polling).
5. **Result:** the finished emoji appears at the top of the gallery. You can download it or like it.


# Emoji Maker — AI Emoji Generator (Wavespeed & Flux-Dev)

## Обзор
**Emoji Maker** — это интеллектуальное веб-приложение для генерации уникальных 3D эмодзи по текстовому описанию. Система объединяет возможности модели **Flux-Dev** (через API Wavespeed) с современной Fullstack-архитектурой для обеспечения быстрого цикла создания, хранения и публикации графического контента.

## Основные возможности
* **Генерация на базе Flux-Dev**: Высококачественные изображения через API [Wavespeed.ai](https://wavespeed.ai/).
* **Интеллектуальный промптинг**: Автоматическое обогащение запросов для достижения стиля "3D icon, centered, clean background".
* **Безопасная загрузка**: API-роут `/api/download` для обхода ограничений CORS и CloudFront при сохранении файлов.
* **Социальный слой**: Публичная галерея с системой лайков в реальном времени.
* **Управление доступом**: Интеграция с **Clerk** для авторизации и ведения истории генераций.

## Технические компоненты

### Генеративный модуль
Реализован в API-роутах Next.js и включает:
* **Long Polling**: Система `pollWavespeedResult` с таймаутом 90 секунд для ожидания готовности изображения.
* **Обработка ошибок**: Валидация статусов API (401, 402, 429) с выводом технических уведомлений.
* **Style Injection**: Приведение всех пользовательских запросов к единому визуальному стандарту.

### Хранилище и БД
* **Supabase (PostgreSQL)**: Хранение метаданных генераций (промпты, связи, ID пользователей).
* **Безопасность хостов**: Валидация доверенных доменов в `isAllowedImageUrl` (Supabase, Wavespeed, CloudFront).
* **Стейт-менеджмент**: Zustand для управления состоянием галереи и индикаторов загрузки.

### Качество и безопасность
* **Проксирование трафика**: Загрузка изображений через серверный буфер для стабильной работы скачивания.
* **Hallucination Detection**: Визуальная проверка статуса загрузки на клиенте перед рендерингом.
* **Оптимизация UI**: Адаптивная сетка на Tailwind CSS с использованием Skeleton-загрузчиков.

## Архитектура системы
Система следует пайплайн-архитектуре:
1. **Input**: Обработка текстового промпта → Добавление стилевых модификаторов.
2. **Generation**: POST запрос к Wavespeed → Поллинг статуса задачи.
3. **Persistence**: Загрузка URL в Supabase → Привязка к сессии Clerk.
4. **Delivery**: Отображение в Gallery Grid → Прокси-скачивание.

## Требования
* Python 3.x (для скриптов обработки) / Node.js 18.x
* Активные API ключи:
    * **Wavespeed AI**
    * **Clerk**
    * **Supabase**

## Установка

1. **Клонирование**:
   ```
   git clone [https://github.com/darialiapun/emogi-maker.git](https://github.com/darialiapun/emogi-maker.git)
   cd emogi-maker

2. **Установка зависимостей**:
    ```
    npm install

3. **Настройка окружения**:
    Создайте файл .env.local в корне проекта и добавьте следующие ключи:
    Фрагмент кода
    ```
    WAVESPEED_API_KEY=your_key_here
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
    CLERK_SECRET_KEY=your_clerk_secret
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

4. **Запуск сервера разработки**:
   ``` 
    npm run dev

## Инструкция по использованию

1. Авторизация: Войдите в систему через виджет Clerk (кнопка Sign In).

2. Ввод данных: Введите краткое описание желаемого образа (например, "neon cyberpunk cat").

3. Генерация: Нажмите кнопку Generate. Система запустит процесс создания через Wavespeed AI.

4. Ожидание: Дождитесь завершения (статус обновляется в реальном времени благодаря системе поллинга).

5. Результат: Готовый эмодзи появится в начале галереи. Вы можете его скачать или поставить лайк.
