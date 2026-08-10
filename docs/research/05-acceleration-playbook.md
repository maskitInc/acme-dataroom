# Acceleration playbook — Data Room MVP (Option A)

**Дата:** 2026-08-10  
**Проєкт:** `tailored-tech-test`  
**ТЗ:** [`docs/test-task.md`](../test-task.md)  
**Baseline:** [`02-deep-research-report.md`](./02-deep-research-report.md) · [`03-decisions.md`](./03-decisions.md)  
**Фокус:** time-to-demo ≤ 4–6h без порушення ТЗ і без зниження оцінки (UX → polish → code)

---

## 1. Executive speed recommendation

Найшвидший compliant шлях:

1. Scaffold одним CLI: **`npx shadcn@latest init -t vite`** (або `pnpm dlx …`) у корені `tailored-tech-test` — одразу React/TS/Tailwind/shadcn SPA (*verify* на [ui.shadcn.com/docs/installation/vite](https://ui.shadcn.com/docs/installation/vite)).
2. За ~15 хв зафіксувати **domain core** руками/AI одним пакетом: types + `uniqueName` + cascade + in-memory repository.
3. Будувати **vertical slices** (rooms → folder CRUD → PDF upload/view → persist IDB), не “всі компоненти шару”.
4. DnD — **після** Must; default kill-switch = “Move to…” dialog (все ще senior UX).
5. README skeleton + git + Vercel підключити **до години 2**, не в кінці.
6. Extra (search / Supabase) — лише після smoke Must на hosted URL.

**Не брати Next** “для швидкості”: ТЗ каже SPA; net win сумнівний, score risk > 0.

---

## 2. TQ compliance matrix

| Acceleration tactic | Saves | Allowed by TQ? | Score risk | Verdict |
|---------------------|-------|----------------|------------|---------|
| shadcn `init -t vite` boilerplate | 30–60m | Yes (boilerplate OK) | Low | **Do** |
| AI для CRUD/UI (explicitly allowed) | 1–2h | Yes | Med if unchecked edge cases | **Do + manual gate** |
| In-memory first → IndexedDB later | 20–40m early | Yes (mock OK) | Low if IDB lands before ship | **Do** |
| IndexedDB forever / skip cloud | hours | Yes (browser mock OK) | None for Must | **Do** |
| Object URL PDF (no pdf.js) | 45–90m | Yes (“view in UI”) | Low | **Do** |
| “Move to…” instead of DnD | 60–90m | Yes (move not required; DnD not in TQ) | Low–Med polish | **OK kill-switch** |
| Seed “Sample Data Room” button | 15m | Yes (improves UX demo) | Low | **Do** |
| Filename client filter | 20–30m | Optional extra | Low | Only if spare time |
| Next.js App Router | ? | Risky vs “SPA” wording | Med–High | **Don’t** |
| Auth / Supabase first | −time | Optional only | High (steals UX hours) | **Don’t early** |
| Fake Share/Permissions buttons | 0 | Violates polish rule | **Critical** | **Never** |
| Multi file types | −time | No (PDF only) | Med | **Don’t** |
| Full folder tree + Miller columns | −45m+ | Not required | Med complexity | **Don’t** — list + breadcrumbs |
| pdf.js full viewer | −60m+ | Overkill | Med bundle | **Don’t** unless iframe fails |
| Monorepo / turborepo | −30m | Unnecessary | Low–Med | **Don’t** |

---

## 3. Scaffold & toolchain fast-path

*Команди verify на день білду — CLI shadcn еволюціонує (v4 templates).*

### 3.1 Preferred (найменше кроків)

```bash
cd tailored-tech-test
# Option: scaffold into current dir or subdir — follow CLI prompts
npx shadcn@latest init -t vite
# or: pnpm dlx shadcn@latest init -t vite
```

Альтернатива з пресетом: [ui.shadcn.com/create](https://ui.shadcn.com/create) → copy generated command (`init --preset … --template vite`).

### 3.2 Fallback (якщо template глючить)

```bash
npm create vite@latest . -- --template react-ts
npm i
# Tailwind per current Vite guide, then:
npx shadcn@latest init
```

### 3.3 Add only what Must needs (після scaffold)

```bash
# shadcn components — мінімум, не весь каталог
npx shadcn@latest add button input dialog dropdown-menu breadcrumb
npx shadcn@latest add alert sonner separator scroll-area sheet

npm i idb          # або dexie — idb легший для простого key-value
# dnd-kit ТІЛЬКИ коли починаєш Should DnD:
# npm i @dnd-kit/core @dnd-kit/utilities
```

**Skip зараз:** router libs якщо вистачить простого state/`window.location` hash; React Query; Zustand (можна useReducer/context); pdf.js; supabase; auth SDKs.

### 3.4 Target folder layout (генерувати одразу)

```text
src/
  domain/
    types.ts
    naming.ts          # uniqueName / (n) suffix
    cascade.ts         # collectDescendants
  storage/
    repository.ts      # interface
    memoryRepo.ts
    idbRepo.ts
  components/
    rooms/
    browser/           # Breadcrumbs, NodeList, FolderRow, FileRow, Toolbar
    pdf/
    dialogs/
  App.tsx
  main.tsx
README.md              # skeleton from minute 30
docs/                  # already exists — don’t move
```

Granular components = оцінка ТЗ; domain окремо = швидші AI-пакети + чистіший review.

---

## 4. Build sequence optimized for scoring

Працюй **vertical slices**. Після кожного slice — клікабельний happy path.

| # | Slice | Час | Done when |
|---|-------|-----|-----------|
| 0 | Scaffold + 3–4 shadcn comps + empty shell | 25–40m | `npm run dev` зелений, layout не “empty HTML” |
| 1 | Domain core: types, naming, cascade, memoryRepo unit-smoke | 25–35m | У консолі/smoke: create folder nest, rename collision, cascade ids |
| 2 | DataRooms list + create + open room | 20–30m | 2 rooms, navigate in/out |
| 3 | Folder browser: list, create, rename, delete+confirm, breadcrumbs | 45–60m | Nest 2 levels, cascade wipe works in UI |
| 4 | PDF upload (accept), rename, delete, preview iframe/new tab | 40–50m | Duplicate name → `(1)`; non-PDF rejected |
| 5 | Empty/error/loading toasts; Sample seed button | 20–30m | Немає “мертвих” кнопок; empty state copy |
| 6 | Wire IndexedDB behind same repository interface | 25–40m | Refresh keeps rooms/files/PDFs |
| 7 | Polish density + Move dialog (або DnD if ahead) | 30–60m | Move file/folder без циклів |
| 8 | README fill + Vercel prod URL smoke | 30–40m | Reviewer checklist green |

**Паралельно (не блокує slices):** після Slice 2 — `git init` / GitHub + Vercel project (навіть з placeholder UI).

### Мінімальний “scoring slice” (якщо паніка)

Slices **1–5 + 8** без IDB persistence = все ще compliant (ТЗ дозволяє memory mock). Краще IDB, але memory+чесний README > зламаний half-IDB.

---

## 5. AI-assisted build protocol

ТЗ дозволяє AI — використовуй як **codegen factory**, не як архітектора (архітектура вже в 02/03).

### 5.1 Prompt packing order (один чат / одна сесія агента)

1. **Paste invariants:** Option A table + types + collision + cascade + PDF-only + no unimplemented UI  
2. **Gen Package A — domain only** (no React): `types.ts`, `naming.ts`, `cascade.ts`, `repository.ts` + `memoryRepo.ts`  
3. **Gen Package B — rooms UI** against memoryRepo  
4. **Gen Package C — folder/file browser + dialogs**  
5. **Gen Package D — pdf preview + upload constraints**  
6. **Gen Package E — idbRepo** implementing same interface  
7. **Gen Package F — Move dialog or dnd-kit** (only if schedule OK)  
8. **Gen Package G — README** from template below  

Не проси “build entire Drive clone” одним промптом.

### 5.2 Ніколи не мерджити AI без ручної перевірки

| Gate | Як перевірити (2–5 хв) |
|------|-------------------------|
| Cascade delete | Folder з 2 subfolders + 2 PDFs → delete → 0 orphans у repo list |
| Name collision | Upload `a.pdf` twice → `a.pdf`, `a (1).pdf` |
| Cycle move | Move folder into its child → blocked + toast |
| Delete confirm | Cancel не видаляє |
| Empty states | New room shows CTA, не blank void |
| Non-PDF | `.png` rejected |
| Unimplemented UI | Search codebase for “Coming soon”, disabled fake nav, dead hrefs |

### 5.3 Anti-slop rules for AI prompts

Додавай у кожен промпт:

- “Do not add Share, Permissions, Auth, Search unless I ask”  
- “PDF only; reject other MIME”  
- “Use existing repository interface; no new global state libs”  
- “Every button must work or must not exist”  

---

## 6. Shortcuts that still look senior

| Shortcut | README wording (TQ language) | Why still strong |
|----------|------------------------------|------------------|
| IndexedDB mock instead of S3 | “Per brief, CRUD/files mocked client-side with IndexedDB for end-to-end UX without backend complexity.” | Matches Technical Requirements |
| Object URL / iframe PDF | “In-browser PDF view via blob URLs; download/open fallback for mobile Safari.” | “View file in UI” satisfied |
| Move dialog vs DnD | “File/folder relocation via explicit Move dialog for reliable mobile+desktop UX; DnD deferred as progressive enhancement.” | Honest; avoids broken touch DnD |
| In-memory → IDB staged | “Repository interface allows swapping persistence; shipped with IndexedDB [or memory if kill-switched].” | Shows good data structures |
| Breadcrumbs not full tree | “Drive-like single-pane navigation with breadcrumbs — optimized for mobile-first clarity.” | Polish + less bugs |
| Sample seed room | “One-click sample Data Room to demonstrate nested structure and PDF preview.” | Reviewer speed = your score |
| Auto-rename `(n)` | “Same-name uploads get deterministic suffixes to avoid silent overwrite in a diligence context.” | Explicit edge case from TQ |

---

## 7. Extra-credit ROI (only if time left)

Після Must smoke на **hosted** URL:

| Rank | Item | Est. | ROI | Note |
|------|------|------|-----|------|
| 1 | Filename filter (client) | 20–30m | High | Optional search; easy |
| 2 | DnD move with dnd-kit (if Move dialog already works) | 45–75m | Med | Nice polish; keep kill-switch |
| 3 | Supabase Storage sync | 90–150m | Med–Low for score/hour | Optional blob; pause risk |
| 4 | Auth | 60m+ | Low | Steals polish time |
| — | Content/full-text PDF search | hours | Bad | Skip |
| — | Both search **and** Supabase | — | Bad | XOR per decisions |

---

## 8. Final 90-minute ship checklist

### T−90 → T−60 (stabilize Must)

- [ ] Rooms create/list/open  
- [ ] Nested folders create/rename/delete cascade  
- [ ] PDF upload/view/rename/delete  
- [ ] Same-name → `(n)`  
- [ ] Empty + error toasts  
- [ ] No dead buttons  
- [ ] Persistence works after refresh **або** README explicitly says memory mock  

### T−60 → T−30 (deploy parallel)

- [ ] GitHub repo public (or private with access as required)  
- [ ] Vercel linked; production deploy green  
- [ ] Open prod URL on phone + desktop once  
- [ ] Paste URL at top of README  

### T−30 → T−0 (README + smoke)

README must cover:

1. Priorities mapping (UX → polish → code)  
2. Stack + why Vite SPA + IndexedDB  
3. Data model + cascade + collision  
4. PDF view approach  
5. Move/DnD decision  
6. Out of scope (auth, cloud, multi-type)  
7. Setup: `npm i && npm run dev`  
8. Hosted URL  

**Reviewer first clicks (smoke in order):**

1. Open hosted URL  
2. Create Data Room  
3. Nest folder + upload PDF + preview  
4. Upload same name again  
5. Rename + delete file  
6. Delete folder cascade  
7. Refresh (persist)  
8. (Bonus) Move / search  

---

## Time salvage map

| Behind by | Cut first | Keep |
|-----------|-----------|------|
| +30–45m | DnD; extra shadcn comps; density tweaks | Must CRUD + PDF view + README |
| +1h | IndexedDB (ship memory + README); Move dialog keep simple | Cascade, collision, deploy |
| +2h | All Should; any Extra; custom illustrations | Slices 1–5 minimal UI + deploy + honest README |
| Panic | Only happy path + seed data + deploy | Collision + cascade still required — don’t skip |

Узгоджено з kill switches у `03-decisions.md`.

---

## Reuse from research vs simplify

| Keep as-is from 02/03 | OK to simplify for speed |
|-----------------------|---------------------------|
| Option A architecture | Skip Option B/C entirely |
| Data model Node/DataRoom | No path materialization / materialized paths |
| Auto-rename `(n)` | Don’t build overwrite UI |
| Hard cascade delete | No trash/soft delete |
| PDF object URL | No pdf.js |
| Vercel host | No custom domain |
| dnd-kit as Should | Ship Move dialog first |
| Scope Must/Should/Extra | Ignore Extra until hosted Must |

---

## Do-not-touch list (false speedups)

1. Next.js “бо зручніше”  
2. Auth “бо extra credit виглядає солідно” на годині 1  
3. Supabase/R2/S3 до Must UX  
4. Повний component gallery shadcn  
5. Perfect binary tree sidebar + multi-column browser  
6. pdf.js + thumbnail grid  
7. Unimplemented Share / Roles / Audit  
8. Monorepo, Storybook, Cypress suite  
9. Content search across PDF bytes  
10. Redesigning data model mid-build  

---

## README skeleton (paste at minute ~30, fill as you go)

```markdown
# Acme Virtual Data Room (MVP)

**Live:** <URL>

## Priorities
Optimized for: (1) UX/functionality (2) design polish (3) code clarity — per take-home brief.

## Stack
Vite + React + TypeScript + Tailwind + shadcn/ui. Client-side persistence via IndexedDB
(metadata + PDF blobs), as allowed by the brief’s mock CRUD guidance.

## Design decisions
- **Data model:** flat adjacency list (`parentId`) for nested folders/files…
- **Same-name uploads:** auto-suffix ` (n)`…
- **Cascade delete:** …
- **PDF viewing:** blob object URLs…
- **Move:** … (dialog and/or dnd-kit)
- **Out of scope:** auth, cloud blob sync, full-text search, multi-type files

## Setup
npm i && npm run dev

## What to try
1. Create a Data Room
2. Nest folders, upload PDFs, preview
3. Upload duplicate filename
4. Delete a folder (cascade)
```

---

## Risks

- shadcn CLI template flags можуть змінитись — якщо `init -t vite` fail, одразу fallback Vite→init (не дебаж 40 хв).  
- AI охоче додає dead nav — gate “no unimplemented UI” на кожному PR/merge.  
- Deploy в кінці = класичний fail; Vercel після Slice 2.  
- DnD на iOS з’їдає Should-години — Move dialog валідний senior shortcut.
