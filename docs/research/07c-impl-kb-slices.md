# Implementation KB — Slice runbooks & Agent prompts

**Parent:** [07-implementation-kb.md](./07-implementation-kb.md)

**Slice-first:** відкривай **лише секцію активного slice** + Package prompt нижче. Не підвантажуй `07a`/`07b` цілком — тільки згадані в таблиці Create/Touch файли й компоненти.

---

## 7. Slice-by-slice runbooks

### Slice 0 — Scaffold (~25–40m)

| | |
|--|--|
| **Goal** | Vite+React+TS+TW+shadcn app runs |
| **Create** | project root via `npx shadcn@latest init -t vite` (fallback: vite → shadcn init) |
| **Add comps** | `button input dialog dropdown-menu breadcrumb alert sonner separator scroll-area sheet` |
| **Touch** | `App.tsx` shell placeholder |
| **Exit** | `npm run dev` OK; blank layout with title “Acme Data Room” |
| **Gate** | no Next; docs/ folder preserved |
| **Forbidden** | full feature UI; installing supabase/auth/dnd |
| **Kill** | init fails → vite fallback within 15m |

### Slice 1 — Domain + Memory (~25–35m)

| | |
|--|--|
| **Goal** | Pure domain + MemoryRepository smoke |
| **Create** | `src/domain/{types,naming,cascade,validatePdf}.ts`, `src/storage/{repository,memoryRepo}.ts` |
| **Optional** | vitest for naming/cascade |
| **Exit** | manual/node assert: nest folders, collision names, cascade ids, pdf reject |
| **Gate** | uniqueName + collectDescendants test vectors pass |
| **Forbidden** | React UI beyond imports |
| **Kill** | — |

### Slice 2 — Rooms UI (~20–30m)

| | |
|--|--|
| **Goal** | S1 create/list/open |
| **Create** | `components/rooms/*`, wire AppShell |
| **State** | `currentRoomId` null vs set |
| **Exit** | 2 rooms create; open shows placeholder S2 |
| **Gate** | empty state CTA works; no dead buttons |
| **Parallel** | `git init` + GitHub + Vercel project |
| **Forbidden** | PDF, folders deep logic incomplete OK as “Open room → Coming” **NO** — show EmptyFolderState stub that will be real in slice 3; don't label unimplemented |
| **Kill** | — |

### Slice 3 — Folder CRUD (~45–60m)

| | |
|--|--|
| **Goal** | FO-* + breadcrumbs + cascade UI |
| **Create** | RoomLayout, Breadcrumbs, Toolbar, NodeList, FolderRow, CreateFolderDialog, RenameDialog, DeleteConfirmDialog, EmptyFolderState |
| **Exit** | nest 2 levels; rename; delete with N; breadcrumbs navigate |
| **Gate** | QA 4–5,10 (without PDF) |
| **Forbidden** | DnD, search, cloud |
| **Kill** | — |

### Slice 4 — PDF (~40–50m)

| | |
|--|--|
| **Goal** | FI-* Must |
| **Create** | UploadPdfButton, FileRow, PdfPreviewSheet; wire uploadFile/getFileBlob/deleteFile |
| **Exit** | upload, preview iframe, rename, delete; duplicate → `(1)`; non-pdf toast |
| **Gate** | QA 6–9; revokeObjectURL on close |
| **Forbidden** | pdf.js |
| **Kill** | iframe broken → Open/Download still satisfy FI-05/06 |

### Slice 5 — Empty/error/seed (~20–30m)

| | |
|--|--|
| **Goal** | Polish states; DR-05; optional DR-06 |
| **Touch** | Empty*, toasts consistency, SeedSampleButton, delete room |
| **Exit** | no dead controls; seed opens demo room |
| **Gate** | grep “Coming soon” / disabled fake = 0 |
| **Forbidden** | Extra search UI |
| **Kill** | skip DR-06 if behind |

### Slice 6 — IndexedDB (~25–40m)

| | |
|--|--|
| **Goal** | IdbRepository parity; default bootstrap |
| **Create** | `idbRepo.ts`; `createRepository()` |
| **Exit** | refresh keeps data+PDFs |
| **Gate** | QA 11 |
| **Forbidden** | schema v2 migrations churn |
| **Kill** | IDB pain → Memory + banner + README note |

### Slice 7 — Move (±DnD) (~30–60m)

| | |
|--|--|
| **Goal** | MV-03; MV-04 if time |
| **Create** | MoveDialog; optional dnd-kit + DropIndicator |
| **Exit** | move file/folder; cycle blocked |
| **Gate** | QA 13; QA 14 if DnD |
| **Forbidden** | DnD without dialog fallback |
| **Kill** | iOS DnD fail → dialog only |

### Slice 8 — README + ship (~30–40m)

| | |
|--|--|
| **Goal** | DL-02/03 |
| **Touch** | README.md fill; prod URL; smoke §17 |
| **Exit** | reviewer checklist green |
| **Gate** | live URL in README top |
| **Forbidden** | starting Supabase/Auth |
| **Kill** | hard stop — ship what works |

---

## 10. Coding-agent prompt pack

Paste SPEC invariants + path to this KB. Then:

### Package A — Domain
```
Implement src/domain/{types,naming,cascade,validatePdf}.ts and src/storage/{repository.ts,memoryRepo.ts}
per docs/research/07a-impl-kb-domain-persistence.md.
Include uniqueName, collectDescendants, validatePdf with the test vectors.
No React. No extra features.
```

### Package B — Rooms
```
Implement S1 rooms UI per 07b AppShell/DataRoomList/CreateRoomDialog/EmptyRoomsState
using DataRoomRepository from context. Only list/create/open. No Share/Auth.
```

### Package C — Folder browser
```
Implement RoomLayout + breadcrumbs + folder CRUD dialogs per 07b and SPEC FO/CA.
Wire MemoryRepository. Cascade confirm must show N. No PDF yet.
```

### Package D — PDF
```
Implement upload/preview/rename/delete PDF per FI + PdfPreviewSheet rules.
Object URL + revoke. Toast on auto-rename. Reject non-PDF and >20MB. No pdf.js.
```

### Package E — IDB
```
Implement idbRepo.ts parity with memoryRepo per 07a §4.
DB acme-dataroom v1, parentKey sentinel "root". Bootstrap with fallback.
```

### Package F — Move
```
Implement MoveDialog (MV-03). Optional dnd-kit only if dialog done.
Block cycles. uniqueName on destination. No unimplemented menu items.
```

### Package G — README
```
Write README from SPEC §15 and playbook skeleton. Include Live URL placeholder,
collision/cascade/IndexedDB decisions, out of scope, What to try.
```
