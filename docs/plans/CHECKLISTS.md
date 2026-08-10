# Action checklists (agent executes — no human verify gates)

## Stage 1 — Plans
- [x] `docs/plans/*`

## Stage 2 — Slice 0 Scaffold
- [x] Preserve `docs/`, `.cursor/`, `AGENTS.md`
- [x] Vite + Tailwind + shadcn
- [x] App shell “Acme Data Room”
- [x] `npm run build` succeeds

## Stage 3 — Slice 1 Domain
- [x] domain types/naming/cascade/validatePdf
- [x] repository + memoryRepo
- [x] vitest domain tests

## Stage 4 — Slice 2 Rooms
- [x] Repo context + DataRoomList
- [x] Create/open/delete room + seed
- [x] GitHub repo

## Stage 5 — Slice 3 Folders
- [x] Breadcrumbs + folder CRUD + cascade confirm
- [x] EmptyFolderState CTAs

## Stage 6 — Slice 4 PDF
- [x] Upload/view/rename/delete + `(n)` toast
- [x] Open/Download fallback

## Stage 7 — Slice 5 Polish
- [x] Seed + delete room + empty states
- [x] No dead nav

## Stage 8 — Slice 6 IDB
- [x] idbRepo + parentKey + fallback Memory

## Stage 9 — Slice 7 Move
- [x] MoveDialog + cycle block

## Stage 10 — Ship
- [x] README + Live URL + GitHub↔Vercel

## Stage 11–13 — Extra ROI
- [x] Filter + PDF dropzone + dnd-kit

## Stage 14–16 — Phase C
- [x] Sync checklists
- [x] Split RoomBrowser → NodeRow, PdfPreviewSheet, BrowserDialogs
- [x] Ship Phase C

## Stage 17–18 — Phase D FTS
- [x] Extract PDF text on upload (pdf.js) + texts store (Memory/IDB)
- [x] `searchInRoom` + SearchHits UI (room-wide name + content)
- [x] Ship FTS to Vercel

## Stage 19–22 — Phase D Supabase + Auth
- [x] Schema: datarooms / nodes / file_texts + Storage bucket `dataroom-files` + RLS
- [x] `SupabaseRepository` + bootstrap (env → cloud, else IDB)
- [x] Magic-link AuthGate + sign out
- [x] Ship env on Vercel + verify live deploy
