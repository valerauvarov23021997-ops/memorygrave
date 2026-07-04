# Промпты для ИИ-видео (перебивки в промо)

Клипы-перебивки для промо-ролика «Память»: живые атмосферные кадры,
которые монтируются между сценами интерфейса.

## Где генерировать (бесплатно)

| Сервис | Бесплатно | Заметки |
|---|---|---|
| **Google Veo 3.1** — gemini.google.com | ~50 кредитов/день | Лучшее качество. На бесплатном тарифе может быть водяной знак |
| **Kling** — klingai.com | ~66 кредитов/день (сгорают за сутки) | Топ по движению камеры |
| **Seedance** — seedance.tv | Щедрый лимит | **Без водяного знака** — приоритет для чистых кадров |

## Общие настройки

- **Формат: вертикальный 9:16** (наш ролик 886×1920)
- Длительность: 5–8 секунд на клип
- Если есть выбор качества — максимальное (1080p+)
- Звук не нужен (свой саунд уже сведён) — но если Veo сгенерирует, не страшно
- Присылать файлы как есть, без пережатия мессенджерами (лучше «файлом»)

## Клипы

### 1. Свеча (для открытия и финала)

> Extreme close-up of a single lit candle flame in darkness, deep forest-green
> background with soft warm glow, golden amber light, gentle flicker, shallow
> depth of field, slow subtle push-in, cinematic, serene and reverent mood,
> warm minimal aesthetic, no people, no text. Vertical 9:16.

### 2. Руки кладут цветы (забота)

> Close-up of gentle hands placing fresh white chrysanthemums on polished dark
> granite, soft morning sunlight, warm cream and sage-green tones, shallow
> depth of field, slow graceful motion, cinematic film look, tender and
> respectful mood, no faces, no text. Vertical 9:16.

### 3. Уход за памятником (услуга)

> Hands in work gloves carefully wiping a polished granite headstone with a
> soft cloth, water droplets glistening, blurred birch trees in background,
> golden hour light filtering through leaves, slow camera orbit, documentary
> cinematic style, warm and calm, no faces, no text. Vertical 9:16.

### 4. Аллея в мягком свете (атмосфера)

> Slow dolly shot along a peaceful tree-lined alley, tall birch trees, dappled
> golden sunlight through leaves, light morning mist, warm green and cream
> palette, tranquil and contemplative mood, cinematic, high detail, no people,
> no text. Vertical 9:16.

### 5. Человек с телефоном (связь на расстоянии)

> Over-the-shoulder view of hands holding a smartphone in a cozy warm room,
> soft window light, evening lamp glow, cream and warm wood tones, shallow
> depth of field, slow push-in, intimate and hopeful mood, screen content not
> visible, no faces, no text. Vertical 9:16.

**Негативный промпт** (если сервис поддерживает, например Kling):

> text, watermark, logo, faces, people looking at camera, harsh light, cold
> blue tones, fast motion, shaky camera, horror, sadness, rain

## Что дальше

Сгенерированные клипы монтируются в промо детерминированным
60fps-пайплайном (`preview-render60.js`): перебивки встают между сценами
интерфейса с непрерывным движением камеры.
