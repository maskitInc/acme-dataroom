# PDF preview chrome — bottom sheet + classic viewer controls

**Date:** 2026-08-10  
**Context:** Replace side Sheet PDF preview with bottom-sheet motion + floating zoom HUD.

## Bottom sheet (research)

| Concern | Practice |
|---------|----------|
| Entry | `translateY(100%)` → `0`, ~250–350ms, `ease-out` |
| Exit | reverse to `translateY(100%)`, same duration (Base UI: `data-starting-style` / `data-ending-style`) |
| Mobile width | `100vw`, height ~`100dvh` or `95dvh` (safe area) |
| Desktop width | ~`90vw` centered (`inset-x-[5%]`), height ~`90dvh` |
| Shape | Rounded top corners; dimmed backdrop fades in/out |
| A11y | Focus trap + Escape (already via Sheet/Dialog) |

Existing `Sheet` `side="bottom"` only nudges `2.5rem` — too weak for a document viewer. Override to **full** `translate-y-full` and longer `duration-300`.

Avoid hash routing conflicts — N/A here.

## Classic PDF HUD

Floating **dark translucent** bar over the document (not a solid white header chrome):

`[ − ]  150%  [ + ]  [ reset ]`

- Reset **disabled** at 100%, **enabled** when zoom ≠ 1  
- Title can stay minimal (sr / thin top) or in the same HUD  
- Actions (Open / Download) as secondary floating bar or slim footer  

## Drag-to-pan hint

Do **not** keep a permanent badge (felt “stuck”). Show once when zoom > 100%, auto-hide ~2s, hide immediately on first pan. Overlay layer must be a **sibling** of the scrollport (`absolute inset-0` shell), not inside the scrolling content.
