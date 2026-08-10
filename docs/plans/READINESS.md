# Submission readiness & code review

**Date:** 2026-08-10  
**Reviewer:** agent (against `docs/test-task.md` + `docs/SPEC.md`)  
**Live:** https://tailored-tech-test-gamma.vercel.app  
**Repo:** https://github.com/maskitInc/acme-dataroom

## Verdict

**~91% submission-ready.** Must CRUD + polish + all three TQ optional extras (deploy/blob, auth, search) are implemented. No fake Share/Roles. **Ship after live magic-link smoke** — no Must blockers.

Share links: **removed from plans** (cancelled).

---

## 1) Readiness breakdown

| Area | Score | Notes |
|------|------:|-------|
| **Overall** | **91%** | Interview-ready with light polish |
| Must CRUD | **97%** | Rooms, nest, PDF CRUD, cascade, collisions |
| UX / functionality | **90%** | Empty states, Move+DnD, outline, toasts |
| Design / polish | **92%** | Clean UI; no dead nav |
| Code quality | **88%** | Strong repo boundary; thin integration tests |
| Optional extras | **95%** | Vercel + Supabase Storage + magic link + FTS |

### Done

- Nested folders, rename, cascade delete with count confirm  
- PDF upload / preview (pdf.js) / rename / delete / `(n)` on upload  
- Move dialog (tree) + drag-and-drop onto folders  
- Outline expand (peek without navigate)  
- IndexedDB + Memory fallback; Supabase cloud when env set  
- Magic-link AuthGate + RLS  
- Room-wide name + PDF text search  
- OS file drop + upload progress  
- Deep link `?room=&folder=`  

### Gaps (non-blocking)

- Live demo requires email OTP (reviewer friction if SMTP flaky)  
- Sample seed = folders only (`sample-pdfs/` unused)  
- Folder create/rename: silent `(n)` suffix (upload toasts; create does not)  
- No Postgres UNIQUE on sibling names (app-level only)  
- PDF preview caps at 40 pages (silent)  
- Breadcrumb lead “Root” vs room name  

### Intentional non-goals

- Share / ACL / capability links (**cancelled**)  
- OAuth, soft delete, non-PDF types, SSR  

---

## 2) TQ requirement matrix

| TQ item | Status | Evidence |
|---------|--------|----------|
| React SPA | done | Vite + React + TS + Tailwind + shadcn |
| Create datarooms | done | `DataRoomList`, `createRoom` |
| Nested folders view/CRUD | done | `RoomBrowser`, outline, cascade |
| PDF upload / view / rename / delete | done | repos + `PdfPreviewSheet` |
| Same-name edge case | done | `uniqueName` + upload toast |
| Granular components | done | `rooms/`, `browser/`, `pdf/`, `dialogs/`, `auth/` |
| End-to-end | done | Live URL |
| Extra: deploy + blob | done | Vercel + Supabase Storage |
| Extra: auth | done | Magic link + RLS |
| Extra: search | done | Name + PDF text (`searchInRoom`) |
| README decisions + setup | done | `README.md` |
| Share links | **N/A cancelled** | SPEC non-goal |

---

## 3) Code review findings

Format: `path: severity — issue. Fix.`

### Medium

- `src/main.tsx` + live env: 🟠 AuthGate gates whole prod app. If magic link fails, reviewer sees nothing. Fix: confirm SMTP; README fallback “clone without env → IDB”.
- `supabase/migrations/..._schema.sql`: 🟠 No UNIQUE `(dataroom_id, parent, name)`. Race can duplicate siblings. Fix: unique index if reopening schema.

### Low

- `AppShell` create folder: 🟡 Always “Folder created” even when auto-suffixed. Fix: toast like upload `renamedFrom`.
- Seed sample: 🟡 Folders only; `sample-pdfs/` unused. Fix: seed 1–2 PDFs for FTS demo.
- `PdfPreviewSheet`: 🟡 Max 40 pages silent. Fix: note in UI/README.
- `RoomBrowser`: 🟡 Loads all room nodes each refresh — OK for MVP scale.
- `tsconfig`: 🟡 Not full `strict: true`.

### Strengths

- Clean `DataRoomRepository` + Memory / IDB / Supabase adapters  
- Domain helpers tested (`naming`, `cascade`, `tree`, `validatePdf`)  
- Cycle guard on move (repo + DnD UI)  
- RLS + private bucket; publishable key only in client  
- No stub Share / Permissions buttons  

---

## 4) Polish anti-patterns

| Check | Result |
|-------|--------|
| Fake Share / Roles | None |
| Dead CTAs | None |
| Unimplemented screens | None |

---

## 5) Hand-in checklist

1. [ ] Smoke magic link on live → full CRUD path  
2. [ ] Confirm no `service_role` in Vercel/`VITE_*`  
3. [ ] README “What to try” matches auth-first flow  
4. [ ] Optional: seed PDFs; folder rename toast; sibling UNIQUE  

---

## 6) Final call

**Polish ops (OTP), then ship.** Exceeds typical 4–6h Must MVP. Highest interview risk is **auth email on live**, not missing features.

Share / encrypted links: **out of plans** — do not build for this submission.
