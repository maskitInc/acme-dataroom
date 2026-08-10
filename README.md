# Acme Virtual Data Room (MVP)

**Live:** https://tailored-tech-test-gamma.vercel.app

## Priorities

Optimized for: (1) UX/functionality (2) design polish (3) code clarity — per take-home brief.

## Stack

Vite + React + TypeScript + Tailwind + shadcn/ui. Client-side persistence via **IndexedDB** (metadata + PDF blobs), as allowed by the brief’s mock CRUD guidance. Falls back to in-memory storage if IndexedDB is unavailable.

Granular UI: `rooms/`, `browser/` (RoomBrowser + NodeRow), `pdf/`, `dialogs/`.

## Design decisions

- **Data model:** flat adjacency list (`parentId`) for nested folders/files within a Data Room
- **Same-name uploads:** auto-suffix ` (n)` (e.g. `report.pdf` → `report (1).pdf`) with toast
- **Cascade delete:** deleting a folder removes all nested folders/files and blobs; confirm shows count
- **PDF viewing:** blob object URLs in a sheet + Open in new tab / Download (mobile-friendly)
- **Move:** “Move to…” dialog + drag handle (`@dnd-kit`, long-press on touch) onto folders
- **Filter:** client-side filename filter in the current folder
- **Upload:** file picker or drop PDF onto the browser area
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
4. Filter by name; drop a PDF onto the list
5. Drag items onto a folder (grip handle) or use Move to…
6. Delete a folder (cascade)
7. Refresh — data persists in IndexedDB

## Plans & research

- Implementation plans: [`docs/plans/`](./docs/plans/)
- Spec: [`docs/SPEC.md`](./docs/SPEC.md)
- Research KB: [`docs/research/07-implementation-kb.md`](./docs/research/07-implementation-kb.md)
