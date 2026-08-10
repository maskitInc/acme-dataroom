# Action checklists (agent executes — no human verify gates)

## Stage 1 — Plans
- [x] `docs/plans/README.md`
- [x] `docs/plans/ROADMAP.md`
- [x] `docs/plans/CHECKLISTS.md`
- [x] `docs/plans/ACCESS.md`
- [x] `docs/plans/STATUS.md`

## Stage 2 — Slice 0 Scaffold
- [ ] Preserve `docs/`, `.cursor/`, `AGENTS.md`
- [ ] `npx shadcn@latest init -t vite` (or vite fallback)
- [ ] Add shadcn: button input dialog dropdown-menu breadcrumb alert sonner separator scroll-area sheet
- [ ] App shell title “Acme Data Room”
- [ ] `npm run build` succeeds

## Stage 3 — Slice 1 Domain
- [ ] `src/domain/types.ts`
- [ ] `src/domain/naming.ts` + test vectors
- [ ] `src/domain/cascade.ts` + test vectors
- [ ] `src/domain/validatePdf.ts`
- [ ] `src/storage/repository.ts`
- [ ] `src/storage/memoryRepo.ts`
- [ ] Smoke script or vitest for collision/cascade

## Stage 4 — Slice 2 Rooms
- [ ] Repo context provider
- [ ] DataRoomList / CreateRoomDialog / EmptyRoomsState
- [ ] Open room → RoomLayout shell
- [ ] GitHub repo created + pushed
- [ ] Vercel project attempted (if CLI/auth)

## Stage 5 — Slice 3 Folders
- [ ] Breadcrumbs + Toolbar + NodeList + FolderRow
- [ ] Create/Rename/Delete folder dialogs
- [ ] Cascade confirm with N
- [ ] EmptyFolderState with CTAs

## Stage 6 — Slice 4 PDF
- [ ] UploadPdfButton (accept PDF, 20MB)
- [ ] FileRow + PdfPreviewSheet (object URL + revoke)
- [ ] Open in new tab + Download
- [ ] Duplicate name → `(n)` + toast
- [ ] Delete file

## Stage 7 — Slice 5 Polish
- [ ] SeedSampleButton
- [ ] Delete room (DR-06)
- [ ] Consistent toasts / empty states
- [ ] Grep: no “Coming soon” / dead nav

## Stage 8 — Slice 6 IDB
- [ ] `idbRepo.ts` parity
- [ ] `parentKey` sentinel `root`
- [ ] Bootstrap Idb → fallback Memory
- [ ] Refresh keeps PDFs

## Stage 9 — Slice 7 Move
- [ ] MoveDialog + cycle block
- [ ] uniqueName on destination
- [ ] Optional dnd-kit only if dialog done

## Stage 10 — Ship
- [x] README §15 complete
- [x] GitHub repo + push
- [x] Live Vercel URL in README
- [x] STATUS.md → 100% Must
- [x] GitHub↔Vercel linked

## Stage 11 — Filter + PDF dropzone
- [x] Filename filter (SE-01)
- [x] Drop PDF onto browser (FI-02)

## Stage 12 — DnD
- [x] `@dnd-kit` drag handle + drop on folders (MV-04)
- [x] Move dialog still available

## Stage 13 — Ship Extra
- [x] README updated
- [ ] Push + auto-deploy Ready

