# PROPORTIONAL ADAPTIVITY GUIDE / РЪКОВОДСТВО ЗА ПРОПОРЦИОНАЛНА АДАПТИВНОСТ

This document explains the "Proportional Scaling" approach used to make VB VISION look identical across all devices, from small iPhones to large Retina displays.
Този документ обяснява подхода "Пропорционално мащабиране", използван за да изглежда VB VISION еднакво на всички устройства.

---

## 1. TECHNICAL STEPS / ТЕХНИЧЕСКИ СТЪПКИ

### Step 1: Global Viewport Optimization / Глобална оптимизация на изгледа

- **EN:** Added `viewport-fit=cover` to meta tags. This allows the app to bleed into the "safe areas" (behind the notch/home bar) of modern smartphones.
- **BG:** Добавяне на `viewport-fit=cover` в мета таговете. Това позволява на сайта да запълни "безопасните зони" (зад зъба/линията за прибиране) на модерните смартфони.

### Step 2: Fluid Typography System / Система за плаваща типография

- **EN:** Replaced static pixels with the `clamp()` function.
  - _Formula:_ `clamp(min, preferred, max)` -> `clamp(2rem, 10vw, 10rem)`.
- **BG:** Замяна на статичните пиксели с функцията `clamp()`.
  - _Формула:_ `clamp(минимум, предпочитано, максимум)`.

### Step 3: Viewport-Based Layout / Оформление базирано на дисплея

- **EN:** Used `vw` (viewport width) for paddings, margins, and section heights instead of fixed `px` or `rem`.
- **BG:** Използване на `vw` (ширина на изгледа) за отстъпи и височини на секции вместо фиксирани пиксели.

### Step 4: Hybrid Device Detection / Хибридно разпознаване на устройства

- **EN:** Implemented a JavaScript detector in the Header that checks for:
  1. `navigator.userAgent` (Detects "Tablet", "Mobile", "Android").
  2. `navigator.maxTouchPoints > 1` (Detects modern iPads that claim to be Desktop/Macintosh).
- **BG:** Внедряване на JavaScript детектор в Header-а, който проверява за мобилни устройства и таблети (включително нови iPad-и).

---

## 2. HOW TO REPEAT THIS (AI PROMPT) / КАК ДА ПОВТОРИТЕ ТОВА (ПРОМТ ЗА AI)

If you want another AI assistant to implement the same "Proportional Scaling" logic, use this prompt:
Ако искате друг AI асистент да приложи същата логика, използвайте този промт:

> \*\*"Implement a 'Proportional Scaling' responsive system. Do not use standard breakpoint jumps. Instead, use a 'Fluid Design' approach:
>
> 1. Use CSS variables with `clamp()` for all typography (fs-h1, fs-body, etc.), scaling based on `vw`.
> 2. Replace static paddings/margins with fluid variables like `clamp(1rem, 5vw, 4rem)`.
> 3. Add `viewport-fit=cover` to index.html and use `env(safe-area-inset-*)` in CSS to handle notches.
> 4. In the Header component, implement a JavaScript device detector using `navigator.userAgent` and `navigator.maxTouchPoints` to force a 'Burger Menu' on all Tablets and Mobile devices regardless of screen width.
> 5. Ensure the site looks like a 'shrunk down' version of the desktop design on smaller screens rather than a completely rearranged layout."\*\*

---

## 3. MASTER CSS TOKENS / ГЛОБАЛНИ СТИЛОВЕ

```css
:root {
  /* Proportional Font Sizes */
  --fs-hero: clamp(2rem, 10vw, 10rem);
  --fs-h1: clamp(1.8rem, 8vw, 6rem);
  --fs-body: clamp(0.85rem, 2vw, 1.1rem);

  /* Proportional Spacing */
  --page-px: clamp(1rem, 5vw, 4rem);
  --section-py: clamp(4rem, 10vw, 10rem);
}

body {
  padding: env(safe-area-inset-top) env(safe-area-inset-right)
    env(safe-area-inset-bottom) env(safe-area-inset-left);
}
```
