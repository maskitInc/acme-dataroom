# Research — Data Room MVP (take-home)

Дослідження перед імплементацією Virtual Data Room для take-home завдання.

| Файл | Зміст |
|------|--------|
| [../test-task.md](../test-task.md) | Оригінальне ТЗ (канонічна копія в `docs/`) |
| [../SPEC.md](../SPEC.md) | **Детальна специфікація продукту/інженерії (для імплементації)** |
| [01-research-brief-prompt.md](./01-research-brief-prompt.md) | Промпт deep research (архітектура, вхід) |
| [02-deep-research-report.md](./02-deep-research-report.md) | Повний звіт: стек, storage, DnD, план 6h |
| [03-decisions.md](./03-decisions.md) | Зафіксовані рішення (короткий cheat-sheet) |
| [04-acceleration-brief-prompt.md](./04-acceleration-brief-prompt.md) | Промпт research прискорення (вхід) |
| [05-acceleration-playbook.md](./05-acceleration-playbook.md) | Playbook: як швидше зібрати Option A без виходу з ТЗ |
| [06-specification-index.md](./06-specification-index.md) | Посилання на канонічний SPEC |
| [07-implementation-kb.md](./07-implementation-kb.md) | **Implementation KB (індекс)** — кодити звідси |
| [07-implementation-kb-overview.md](./07-implementation-kb-overview.md) | KB: traceability + dependency graph |
| [07a-impl-kb-domain-persistence.md](./07a-impl-kb-domain-persistence.md) | KB: domain algorithms + repository/IDB |
| [07b-impl-kb-components.md](./07b-impl-kb-components.md) | KB: component encyclopedia + journeys |
| [07c-impl-kb-slices.md](./07c-impl-kb-slices.md) | KB: slice runbooks + agent prompts |
| [07d-impl-kb-adr-dod.md](./07d-impl-kb-adr-dod.md) | KB: ADR defaults + DoD checklists |

**Дата дослідження:** 2026-08-10  
**Рекомендація:** Option A — Vite + React/TS/Tailwind/shadcn + IndexedDB + Vercel; DnD через `@dnd-kit`; Supabase Storage лише як extra credit.  
**Перед кодингом:** [07-implementation-kb.md](./07-implementation-kb.md) (slice-first) · [../SPEC.md](../SPEC.md) · [03-decisions.md](./03-decisions.md) · [05-acceleration-playbook.md](./05-acceleration-playbook.md).  

**Cursor rules (проєкт):**

| Rule | Apply | Навіщо |
|------|-------|--------|
| `.cursor/rules/dataroom-mvp.mdc` | always | стек, TQ, kill switches |
| `.cursor/rules/slice-first-kb.mdc` | always | не читати всю KB одразу |
| `.cursor/rules/spec-sync.mdc` | docs/** | SPEC → спочатку ADR/DoD |
| `.cursor/rules/app-conventions.mdc` | `src/**` | repository pattern, no dead UI |
