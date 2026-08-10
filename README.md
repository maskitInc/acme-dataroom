# Acme Virtual Data Room (MVP)

**Live:** https://tailored-tech-test-gamma.vercel.app

## Priorities

Optimized for: (1) UX/functionality (2) design polish (3) code clarity — per take-home brief.

## Stack

Vite + React + TypeScript + Tailwind + shadcn/ui.

**Persistence (auto-selected):**
- With `VITE_SUPABASE_*` env → **Supabase** (Postgres metadata + Storage PDFs + magic-link auth, RLS per user)
- Without env → **IndexedDB** (local), with in-memory fallback if IDB unavailable

Granular UI: `rooms/`, `browser/` (RoomBrowser + NodeRow + SearchHits), `pdf/`, `dialogs/`, `auth/`.

## Design decisions

- **Data model:** flat adjacency list (`parentId`) for nested folders/files within a Data Room
- **Same-name uploads:** auto-suffix ` (n)` (e.g. `report.pdf` → `report (1).pdf`) with toast
- **Cascade delete:** deleting a folder removes all nested folders/files and blobs; confirm shows count
- **PDF viewing:** blob object URLs in a sheet + Open in new tab / Download (mobile-friendly)
- **Move:** “Move to…” dialog + drag handle (`@dnd-kit`, long-press on touch) onto folders
- **Search:** room-wide name + PDF text (indexed on upload via pdf.js); UI goes through `repository.searchInRoom`
- **Upload:** file picker or drop PDF onto the browser area
- **Cloud:** `SupabaseRepository` implements the same repository interface; Auth = email magic link
- **Out of scope:** multi-type files, fine-grained share permissions, OAuth (easy to add later)

## Setup

```bash
npm i
cp .env.example .env.local   # optional — fill Supabase URL + publishable key
npm run dev
```

```bash
npm test
npm run build
```

Schema (already applied on the linked project): `supabase/migrations/`.

## What to try

1. Sign in with magic link (cloud mode) or open locally without env (IndexedDB)
2. Create a Data Room (or **Load sample**)
3. Nest folders, upload PDFs, preview
4. Search by filename or PDF content (room-wide)
5. Drag items onto a folder or use Move to…
6. Refresh — cloud data persists in Supabase; local mode uses IndexedDB

## Plans & research

- Implementation plans: [`docs/plans/`](./docs/plans/)
- Spec: [`docs/SPEC.md`](./docs/SPEC.md)
- Research KB: [`docs/research/07-implementation-kb.md`](./docs/research/07-implementation-kb.md)
