# File drag-and-drop UX — best practices (OS → browser)

**Date:** 2026-08-10 (rev 2)  
**Goal:** Acme Data Room feels like Drive/Dropbox when dragging a PDF from the OS into the app.

## Product pattern (what users expect)

| Moment | Expected feedback |
|--------|-------------------|
| File dragged **over the browser window** | App reacts immediately — dimmed fullscreen overlay, clear “Drop PDF to upload” |
| Pointer moves around children | Overlay **does not flicker** |
| Drop **anywhere** in the room view | File accepted into **current folder** |
| Drop outside / cancel | Overlay gone; browser must **not** navigate to the PDF |
| Wrong type (`.docx`) | Reject with toast; overlay still closes |
| Mobile / no DnD | Visible **Upload** button / file picker remains primary |

References: Drive, Dropbox, Slack, Gmail attach; Nielsen Norman — dashed border = droppable cue; MDN File drag and drop.

## Technical best practices

1. **Window/document listeners, not a tiny box**  
   Small list-only zones fail UX and miss drops on chrome (header, gaps). Full-window target + overlay is the industry default.

2. **Always `preventDefault` on `dragover` + `drop`**  
   Otherwise `drop` never fires / browser opens the file as a document.

3. **Enter/leave depth counter**  
   Crossing child nodes fires leave→enter; only hide overlay when depth hits 0. Alternative: overlay children `pointer-events: none`.

4. **Listen in capture phase** when in-app DnD libs exist (`@dnd-kit`)  
   Bubble-phase handlers can lose to libraries that call `stopPropagation`. Capture on `window` wins for OS files.

5. **Detect files via `types` + `items`**  
   Chrome: `Files`; Firefox: also `application/x-moz-file`; Safari: `DOMStringList.contains('Files')` / `items.kind === 'file'`. Be permissive during `dragenter` (types sometimes sparse).

6. **`dropEffect = 'copy'`** on valid hover — OS cursor shows “copy/add”.

7. **Idle empty state** still shows dashed “drop here” hint even without an active drag (affordance).

8. **Do not rely on `dragstart`/`dragend` for OS files** — they do not fire. Use enter/leave/over/drop only.

9. **Progress after drop** — separate concern; show upload bar immediately after accept.

10. **Accessibility** — overlay is decorative (`aria-hidden` or `role="status"`); keep keyboard path via Upload button.

## Failure modes we hit (rev 1)

- Drop zone only wrapped the node list → easy to miss; no “window knows I’m dragging”.
- Window guard `preventDefault`’d drops outside zone → file swallowed, no upload.
- Possible competition with `@dnd-kit` in bubble phase.

## Fix (rev 2)

- `subscribeWindowOsFileDrop` — capture-phase window enter/over/leave/drop + depth counter  
- `FileDropOverlay` — fullscreen “Drop PDF to upload into this folder”  
- Drop anywhere while RoomBrowser mounted → `runUpload`  
- Idle empty state keeps dashed affordance  

## Checklist

- [ ] Chrome / Firefox / Safari / Edge desktop: drag PDF over window → overlay  
- [ ] Drop anywhere → upload + progress  
- [ ] Escape / leave window → overlay clears  
- [ ] In-app folder DnD still works  
- [ ] Mobile: Upload button works  
