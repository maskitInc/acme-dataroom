# Implementation KB — ADR pack & Definition of Done

**Parent:** [07-implementation-kb.md](./07-implementation-kb.md)

---

## 8. ADR decisions pack (underspecified → locked defaults)

### ADR-01 — Room list sort
**Decision:** `createdAt` descending (newest first).  
**Why:** Diligence users create rooms in session order; matches “recent work”.  
**Alt:** name asc — skip unless requested.

### ADR-02 — Single-file delete confirm
**Decision:** **Yes**, lightweight confirm (“Delete {name}?”).  
**Why:** Consistent with destructive pattern; cheap; prevents mis-tap on mobile.  
**Alt:** delete immediately — only if extreme timebox.

### ADR-03 — Routing
**Decision:** **React state first** (`currentRoomId`, `currentParentId`); add `react-router` only if &lt;15m and desire shareable URLs.  
**Why:** Timebox; deep links not in TQ Must.  
**If router:** `/`, `/rooms/:roomId`, `/rooms/:roomId/folders/:folderId`.

### ADR-04 — `parentId` null indexing
**Decision:** Denormalized `parentKey = parentId ?? "root"` on stored node for IDB compound index; API still uses `parentId: Id | null`.  
**Why:** Clean `IDBKeyRange.only([dataroomId, parentKey])`.

### ADR-05 — Seed sample content
**Decision:** Create room “Sample Diligence Room” + folders `Legal/`, `Legal/Contracts/`, `Finance/` **without** binary PDF (avoid bundling assets). Show empty Contracts with empty-state CTA.  
**Why:** No asset pipeline; still demos nesting.  
**Alt:** generate minimal PDF bytes in JS if &lt;20m spare.

### ADR-06 — Delete Data Room (DR-06)
**Decision:** **Implement** in Slice 5 via row kebab (Should).  
**Why:** Cheap with existing cascade; avoids orphan rooms.  
**Kill:** hide if behind schedule — don't show broken control.

### ADR-07 — Children sort in folder
**Decision:** Folders alphabetically, then files alphabetically (case-sensitive OK).  
**Why:** Predictable Drive-like scan.

### ADR-08 — Auto-rename toast copy
**Decision:** `Saved as "{finalName}"` when final ≠ original.  
**Why:** SPEC NA-03.

### ADR-09 — Persistence degraded banner
**Decision:** If IDB unavailable, use Memory + dismissible banner: “Storage unavailable — data lasts until you close the tab.” Document in README.

### ADR-10 — Package manager
**Decision:** **npm** (default with vite/shadcn docs). Stick to one lockfile.

---

## 9. Definition of Done — Must SPEC IDs

### Data Rooms
- [ ] **DR-01** Create room with non-empty trimmed name → appears in list  
- [ ] **DR-02** List rooms sorted by createdAt desc  
- [ ] **DR-03** Open room → S2 at parentId null  
- [ ] **DR-04** Empty home has working Create CTA  

### Folders
- [ ] **FO-01** Create folder in current dir  
- [ ] **FO-02** Nest folder inside folder  
- [ ] **FO-03** List shows only children of current parent  
- [ ] **FO-04** Rename folder with collision policy  
- [ ] **FO-05** Delete folder confirms with N; cascade removes descendants+blobs  
- [ ] **FO-06** Empty folder shows New folder + Upload actions  

### Files
- [ ] **FI-01** File picker accept PDF  
- [ ] **FI-03** Non-PDF rejected, toast, nothing stored  
- [ ] **FI-04** &gt;20MB rejected  
- [ ] **FI-05** Preview via object URL in UI  
- [ ] **FI-06** Open in new tab + Download always visible  
- [ ] **FI-07** Rename file + collision  
- [ ] **FI-08** Delete file removes node+blob  

### Naming / Cascade
- [ ] **NA-01** Sibling uniqueness  
- [ ] **NA-02** Auto `(n)` suffix  
- [ ] **NA-03** Toast on auto-rename  
- [ ] **NA-04** Empty/whitespace rejected  
- [ ] **CA-01..04** Descendants collected; blobs gone; nodes gone; confirm copy  

### Deliverables / NFR
- [ ] **DL-01** GitHub repo with code  
- [ ] **DL-02** README with §15 sections  
- [ ] **DL-03** Public Vercel HTTPS URL  
- [ ] **NF-01** Usable Chrome+Safari desktop; mobile usable  
- [ ] **NF-02** Free tier only  
- [ ] **NF-05** No secrets  
- [ ] **NF-06** Labeled buttons; dialogs focusable  

### Should (track separately)
- [ ] DR-05 Seed  
- [ ] DR-06 Delete room  
- [ ] FI-02 Drop upload  
- [ ] FI-09 Size/date  
- [ ] MV-01..03 Move dialog  
- [ ] MV-04 DnD  

### Extra / Skip
- SE-01 only after Must hosted smoke  
- SE-03 / Auth / Cloud — skip unless explicit surplus  

---

## Risk checklist (component-tied)

| Risk | Component / layer | Mitigation |
|------|-------------------|------------|
| Object URL leak | PdfPreviewSheet | revoke on close/unmount |
| Cascade orphans | idbRepo.deleteFolder | single transaction where possible |
| Touch scroll broken | DropIndicator / DnD | handle-only; or kill DnD |
| Dead menu item | NodeActionsMenu | only ship working actions |
| Stale list | RoomLayout | await repo then setChildren |
| Silent rename | UploadPdfButton | compare names → toast |
| Deploy last | Slice 2 parallel | Vercel early |
| AI scope creep | all | prompt pack “no Share/Auth/Search” |

---

## Spec change sync procedure

When `docs/test-task.md` or `docs/SPEC.md` (or locked decisions) change:

1. Update **this file** first (ADR + DoD checkboxes)  
2. Patch affected **slice** exit/gates in [07c](./07c-impl-kb-slices.md)  
3. Patch only touched sections in [07a](./07a-impl-kb-domain-persistence.md) / [07b](./07b-impl-kb-components.md)  
4. Update traceability rows in [overview](./07-implementation-kb-overview.md) if SPEC IDs moved  
5. Refresh one-liners in [03-decisions.md](./03-decisions.md) if cheat-sheet drifted  
6. Add a **Changelog** bullet below  

Cursor enforces this via `.cursor/rules/spec-sync.mdc`.

### Changelog

- **2026-08-10:** Initial ADR-01..10 + DoD from SPEC v1.0; slice-first + spec-sync project rules added.

---

## Quick links

- Domain: [07a](./07a-impl-kb-domain-persistence.md)  
- Components: [07b](./07b-impl-kb-components.md)  
- Slices: [07c](./07c-impl-kb-slices.md)  
- SPEC: [../SPEC.md](../SPEC.md)  
- Playbook: [05-acceleration-playbook.md](./05-acceleration-playbook.md)  
- KB index: [07-implementation-kb.md](./07-implementation-kb.md)
