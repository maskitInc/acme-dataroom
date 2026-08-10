# Cross-browser OS → browser file drop + upload progress

**Date:** 2026-08-10  
**Scope:** Acme Data Room (Vite/React) — desktop OS file drop into the room browser, visible upload progress (IndexedDB + Supabase).

## 1) OS file drop (cross-browser)

### Required API behaviour ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop))

| Event | Must | Why |
|-------|------|-----|
| `dragover` | `preventDefault()` | Without it, browser **never fires `drop`** |
| `drop` | `preventDefault()` | Without it, browser **navigates** / opens the PDF in the tab |
| `dragenter` / `dragleave` | UI only | Highlight zone; **not** used to enable drop |

### Quirks we hit in practice

1. **Window vs zone:** Drop outside the zone still opens the file as a page. Fix: document/window `dragover` + `drop` → `preventDefault()` when `DataTransferItem.kind === 'file'` (MDN pattern).
2. **`dragleave` flicker:** Leaving a child node inside the zone fires `dragleave` on the parent (Chrome/Safari). Fix: **enter/leave counter** (increment on enter, decrement on leave; clear highlight only at 0).
3. **Type sniffing:** Prefer `dataTransfer.items` (`kind === 'file'`) over `types.includes('Files')`. Firefox may also expose `application/x-moz-file`. Safari is more reliable with `items`.
4. **`dropEffect`:** On `dragover` set `dataTransfer.dropEffect = 'copy'` so cursor matches “add file”.
5. **Mobile:** HTML5 DnD from OS **does not work** on iOS/Android. Always keep `<input type="file">` (already present).
6. **Conflict with in-app DnD (`@dnd-kit`):** Internal moves do not put `Files` in `dataTransfer`. Gate OS highlight/handlers on file-kind detection so folder moves stay unaffected.
7. **`dragstart`/`dragend`:** Not fired for OS → browser drags. Cannot customize drag image for OS files.

### Acceptance checklist

- [ ] Chrome / Edge / Firefox / Safari desktop: drop PDF into zone uploads; drop outside does **not** navigate away
- [ ] Highlight stable while pointer moves over children
- [ ] Non-PDF rejected with toast (existing `validatePdf`)
- [ ] Mobile: Upload button / file picker still works

## 2) Upload progress

### Reality

- **`fetch` / supabase-js `storage.upload()`** do **not** expose byte progress.
- Options: (a) **XMLHttpRequest** `xhr.upload.onprogress` against Storage REST, (b) **TUS resumable** (`tus-js-client` / Uppy) — overkill for ≤50 MB PDFs.

### Chosen approach (TQ / minimal)

| Backend | Progress source |
|---------|-----------------|
| Supabase Storage | XHR POST to `/storage/v1/object/{bucket}/{path}` + session Bearer + publishable `apikey` |
| IndexedDB / Memory | Synthetic phase progress: validate → extract text → write blob → finalize |

Overall UI percent maps phases into 0–100 so users always see motion even when extract dominates time on small files.

```
validate  0–5%
extract   5–25%   (or 5–40% local)
store    25–90%   (real bytes on cloud; synthetic local)
finalize 90–100%
```

### Repository contract

```ts
uploadFile(roomId, parentId, file, onProgress?: (p: UploadProgress) => void)
```

UI must not talk to Storage/IDB directly — only via repository (existing TQ rule).

## 3) Implementation map (this PR)

- `docs/research/08-cross-browser-file-drop-upload-progress.md` — this note
- `src/lib/osFileDrop.ts` — file-kind detection helpers
- `src/domain/types.ts` — `UploadProgress`
- `src/storage/*Repo.ts` — `onProgress` + Supabase XHR upload
- `src/components/browser/UploadProgressBar.tsx` + `RoomBrowser` drop hardening
- `AppShell` — pass progress callback into upload

## References

- [MDN: File drag and drop](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/File_drag_and_drop)
- [MDN: Drag operations](https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API/Drag_operations)
- [Supabase resumable uploads (TUS)](https://supabase.com/docs/guides/storage/uploads/resumable-uploads)
- [supabase/storage-api#23](https://github.com/supabase/storage-api/issues/23) — XHR progress pattern
