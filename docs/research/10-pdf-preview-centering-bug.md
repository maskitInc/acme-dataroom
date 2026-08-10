# PDF preview horizontal centering bug

**Symptom:** Dark preview pane shows ~5% light strip only on the **left**; PDF + HUD sit toward the **right**.

## Root cause

Bottom sheet used:

- `w-full` (width = 100% of viewport)
- plus `sm:data-[side=bottom]:inset-x-[5%]` → intending `left: 5%; right: 5%`

But default Sheet also ships `data-[side=bottom]:inset-x-0`. Competing `data-*` utilities often **don’t merge cleanly** in Tailwind — `left: 5%` can win while `right` stays `0` / width stays `100%`.

Resulting box math:

```
left = 5vw, width = 100vw  →  extends to 105vw
```

Only a left gutter is visible; the panel (and “centered” content inside it) looks shifted right on screen.

## Correct pattern

Do **not** combine `w-full` with asymmetric insets. Prefer explicit left/right (width comes from insets):

```
inset-x-0              /* mobile: full bleed */
sm:left-[5%] sm:right-[5%] sm:w-auto
```

Or: `sm:w-[90vw] sm:left-1/2 sm:right-auto sm:-translate-x-1/2` (watch conflict with `translate-y` enter animation — prefer left/right insets).

Inner PDF pages: keep `items-center justify-center` on a `min-h-full` flex column; centering is relative to the sheet content box, which must itself be correctly placed.
