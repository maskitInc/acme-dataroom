# Implementation Knowledge Base — Index

**Дата:** 2026-08-10  
**Проєкт:** `tailored-tech-test`  
**Джерело:** [`docs/SPEC.md`](../SPEC.md) v1.0 + research 02/03/05  
**Статус:** Ready for coding agents / humans  
**Cursor rules:** `.cursor/rules/dataroom-mvp.mdc`, `slice-first-kb.mdc`, `spec-sync.mdc`, `app-conventions.mdc`

## Slice-first (обов’язково)

KB розбита навмисно: **не читай усі `07*` файли за раз**.

На один slice відкривай лише:

| Крок | Файл | Скільки |
|------|------|---------|
| 1 | [07d ADR/DoD](./07d-impl-kb-adr-dod.md) | skim ADR + релевантні DoD |
| 2 | [07c runbook **поточного** slice](./07c-impl-kb-slices.md) | одна секція |
| 3 | [07a](./07a-impl-kb-domain-persistence.md) | лише якщо domain/repo |
| 4 | [07b](./07b-impl-kb-components.md) | лише компоненти цього slice |
| 5 | [overview](./07-implementation-kb-overview.md) | лише якщо треба priority/trace |

Повний SPEC / `02-deep-research-report` — тільки при конфлікті інтерпретації.

## 1. Як читати під час кодингу (executive)

1. ADR defaults → [07d](./07d-impl-kb-adr-dod.md)  
2. Поточний slice runbook → [07c](./07c-impl-kb-slices.md)  
3. Domain/repo при логіці даних → [07a](./07a-impl-kb-domain-persistence.md)  
4. UI компонент → [07b](./07b-impl-kb-components.md)  
5. Traceability / priority → [07-implementation-kb-overview.md](./07-implementation-kb-overview.md)  
6. Перед merge slice → DoD checkboxes у [07d](./07d-impl-kb-adr-dod.md)  
7. Конфлікт: **TQ > SPEC > KB ADR**

**Build order:** Slice0 scaffold → 1 domain/memory → 2 rooms (+ Vercel) → 3 folders → 4 PDF → 5 polish/seed → 6 IDB → 7 Move(±DnD) → 8 README/ship.

**Kill switches:** DnD→Move dialog · IDB→memory+README · після ~5h лише ship · Extra = search XOR supabase.

## Якщо змінюється SPEC

Спочатку синхронізуй **ADR/DoD (`07d`)**, потім slices (`07c`), потім точково `07a`/`07b`/`overview`. Деталі: правило `.cursor/rules/spec-sync.mdc` і секція Sync у [07d](./07d-impl-kb-adr-dod.md).

## Файли цієї KB

| Файл | §§ brief | Зміст |
|------|----------|--------|
| [07-implementation-kb-overview.md](./07-implementation-kb-overview.md) | 1–2 | Executive map, decomposition, traceability, dependency graph |
| [07a-impl-kb-domain-persistence.md](./07a-impl-kb-domain-persistence.md) | 3–4 | Algorithms, test vectors, repo methods, IDB, blobs |
| [07b-impl-kb-components.md](./07b-impl-kb-components.md) | 5–6 | Component encyclopedia, journeys A–D |
| [07c-impl-kb-slices.md](./07c-impl-kb-slices.md) | 7,10 | Slice runbooks 0–8, coding-agent prompts A–G |
| [07d-impl-kb-adr-dod.md](./07d-impl-kb-adr-dod.md) | 8–9 | ADR-01..10, Must DoD checklists, risks |

## Locked stack

Vite SPA · React/TS · Tailwind · shadcn · IndexedDB (`idb`) · Vercel · PDF-only · Option A repository pattern · Move dialog before dnd-kit.
