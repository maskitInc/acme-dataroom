# Acme Virtual Data Room (MVP)

**Live:** _(deploy URL will appear here after Vercel)_

## Priorities

Optimized for: (1) UX/functionality (2) design polish (3) code clarity — per take-home brief.

## Stack

Vite + React + TypeScript + Tailwind + shadcn/ui. Client-side persistence via **IndexedDB** (metadata + PDF blobs), as allowed by the brief’s mock CRUD guidance. Falls back to in-memory storage if IndexedDB is unavailable.

## Design decisions

- **Data model:** flat adjacency list (`parentId`) for nested folders/files within a Data Room
- **Same-name uploads:** auto-suffix ` (n)` (e.g. `report.pdf` → `report (1).pdf`) with toast
- **Cascade delete:** deleting a folder removes all nested folders/files and blobs; confirm shows count
- **PDF viewing:** blob object URLs in a sheet + Open in new tab / Download (mobile-friendly)
- **Move:** explicit “Move to…” dialog (reliable on mobile + desktop); DnD deferred
- **Out of scope:** auth, cloud blob sync, full-text search, multi-type files, permissions

## Setup

```bash
npm i
npm run dev
```

```bash
npm test    # domain unit tests
npm run build
```

## What to try

1. Create a Data Room (or **Load sample**)
2. Nest folders, upload PDFs, preview
3. Upload the same filename again → auto-rename
4. Rename / move / delete a file
5. Delete a folder (cascade)
6. Refresh — data persists in IndexedDB

## Plans & research

- Implementation plans: [`docs/plans/`](./docs/plans/)
- Spec: [`docs/SPEC.md`](./docs/SPEC.md)
- Research KB: [`docs/research/07-implementation-kb.md`](./docs/research/07-implementation-kb.md)
