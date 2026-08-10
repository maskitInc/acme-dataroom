# Decisions cheat-sheet

Швидкий довідник перед кодингом.  
ТЗ: [`docs/test-task.md`](../test-task.md).  
Спека: [`docs/SPEC.md`](../SPEC.md).  
**Implementation KB:** [`07-implementation-kb.md`](./07-implementation-kb.md) (slice-first).  
**Cursor rules:** `.cursor/rules/dataroom-mvp.mdc`, `slice-first-kb.mdc`, `spec-sync.mdc`, `app-conventions.mdc`.  
Деталі дослідження — у [02-deep-research-report.md](./02-deep-research-report.md).  
Прискорення збірки — у [05-acceleration-playbook.md](./05-acceleration-playbook.md).

## Locked (рекомендовано)

| Тема | Рішення |
|------|---------|
| Архітектура | **Option A** — client-only MVP |
| SPA | Vite + React + TypeScript |
| UI | Tailwind + shadcn/ui |
| Metadata + PDF blobs | **IndexedDB** |
| Hosting | Vercel Hobby |
| DnD | `@dnd-kit` + TouchSensor delay |
| Same-name | Auto-rename `name (n).pdf` |
| Delete | Hard delete + cascade |
| PDF view | Object URL + iframe / new tab |
| File types | PDF only |
| Auth | Skip (extra only) |
| Cloud blobs | Skip unless time left → **Supabase Storage** |

## Do not spend time on (у 6h)

- Next.js (ТЗ = SPA)
- AWS S3 / Cloudflare R2
- Full-text PDF search
- Permissions / audit / versioning
- Soft delete / trash
- Unimplemented nav items

## Kill switches

1. DnD ламається на iOS → “Move to…” dialog  
2. IndexedDB болить → in-memory + README note  
3. Після 5:00 — лише README + deploy  
4. Extra: search **або** Supabase, не обидва  

## First implement order

1. Scaffold (`npx shadcn@latest init -t vite` — див. playbook)  
2. Data model + in-memory CRUD  
3. UI flows (rooms → folders → files)  
4. IndexedDB  
5. Polish + Move dialog (DnD лише якщо є час)  
6. Deploy + README — **підключити Vercel рано** (після rooms), не в кінці  

Детальний timing / AI protocol / salvage map → [05-acceleration-playbook.md](./05-acceleration-playbook.md). 
