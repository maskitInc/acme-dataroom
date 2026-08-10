# DEEP RESEARCH BRIEF — Data Room MVP: free stack + DnD UX + file storage

Промпт, з якого запускалось дослідження (2026-08-10).  
Канонічне ТЗ: [`docs/test-task.md`](../test-task.md).

---

## ROLE

Ти — senior product/engineering researcher + staff frontend architect. Глибина: production-grade research для take-home, який треба зібрати швидко (цільовий бюджет **4–6 годин**, з можливим невеликим оверраном), без overengineering.

**Що ти робиш:** дослідження, порівняння опцій, рекомендації з trade-offs, конкретний план ітерацій, data model, UX patterns для drag-and-drop на mobile+desktop.

**Чого НЕ робиш:** не пиши повний код застосунку; не деплой; не створюй акаунти; не пропонуй платні плани як «must»; не роздувай scope за межі ТЗ + чітко позначеного extra credit.

---

## BACKGROUND — Acme Corp. Virtual Data Room (take-home)

Acme Corp. веде due diligence для великої угоди і потребує **віртуальний Data Room**: організоване сховище документів (натхнення: Google Drive / Dropbox / Box). Data Room = top-level «диск» / коренева папка.

### Офіційні пріоритети оцінки (у цьому порядку)

1. **UX і функціональність** — інтуїтивні флоу, edge cases, error states
2. **Design & polish** — чистий UI; **немає** кнопок/екранів «не реалізовано»
3. **Code quality & readability**

### Жорсткі вимоги ТЗ

- **SPA frontend** на React-екосистемі. Референс стеку клієнта компанії: **React / TypeScript / Tailwind / shadcn/ui**
- Користувач може **створювати Data Rooms** і **завантажувати файли**
- Рішення має працювати **end-to-end**
- Дозволено mock CRUD: JSON / IndexedDB / інше локальне сховище
- Дозволені boilerplates і AI-асистований код
- Deliverables: **GitHub repo + README** (design decisions + setup) + **hosted URL** (рекомендують **Vercel**)

### Functional CRUD

**Folders**

- Create + **nest** folders
- View contents (nested files/folders)
- Rename folder
- Delete folder **з усім вкладеним** (cascade)

**Files**

- Upload (**лише PDF** на MVP)
- ТЗ явно дозволяє зберігати файл **у browser memory (mock)**
- View file in UI
- Rename file
- Delete file

**Edge cases (явно згадані в ТЗ)**

- Upload файлів з **однаковою назвою**
- Добрі структури даних для metadata/state під CRUD + вкладеність
- Granular React components

### Optional / extra credit (лише якщо лишається час)

- Deploy FE+BE; файли в **blob storage**; публічний доступ
- Auth (social або email/password)
- Search/filter за іменами (і опційно за contents)

### Контекст власника проєкту

- Новий порожній репозиторій/папка: `tailored-tech-test`
- Хочемо зробити **швидко і просто**, але **строго в рамках ТЗ**
- Плануємо **гарний UI**, зокрема **drag-and-drop**, зручний **однаково на mobile і desktop** (mobile-first)
- Persistence на кшталт **Supabase + Vercel**, але неясно де безкоштовно зберігати PDF
- Усе на **безкоштовних** тарифах (free tier / hobby)

---

## RESEARCH QUESTION

**Головне питання:** Який мінімально достатній, безкоштовний і швидкий у реалізації архітектурний шлях для Data Room MVP (React/TS/Tailwind/shadcn), щоб виконати обов’язкове ТЗ з відмінним DnD UX на mobile+desktop, і (за часом) додати безкоштовний hosted deploy з реальним зберіганням PDF — без платних сервісів і без зайвої складності?

### Підпитання

1. Scope cut для 4–6 год
2. Persistence: IndexedDB vs Supabase vs hybrid
3. File storage на free tier (де саме PDF blobs)
4. Auth на free — чи потрібен для MVP
5. DnD best practices (mobile + desktop)
6. Data model + collision policy
7. PDF viewing strategy
8. Hosting: Vercel-only vs Vercel + Supabase

---

## CONSTRAINTS & INVARIANTS

1. Timebox ~4–6 hours
2. Лише free/hobby tiers
3. Не показувати unimplemented UI
4. PDF-only на MVP
5. Cascade delete папки
6. Ясна same-name policy
7. SPA / React; polish > feature sprawl
8. Mobile + desktop parity для DnD
9. README з design decisions — частина оцінки

---

## SUCCESS CRITERIA FOR RESEARCH OUTPUT

1. Root-cause framing
2. Gap analysis must/should/extra/skip
3. 2–3 architecture options з trade-offs
4. Рекомендація де зберігати файли безкоштовно
5. DnD synthesis
6. Canonical data model
7. Ordered 6h plan
8. Risks / spikes
9. README outline
