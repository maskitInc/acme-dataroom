# 11 — Share links (capability URLs + revoke)

**Status:** **Cancelled / not planned** (2026-08-10). Archived research only — do not implement for take-home.  
**Date:** 2026-08-10  
**Related:** SPEC §2.2 non-goal (sharing/permissions); TQ optional = deploy/auth/search only (no share).

> Plans updated: `docs/plans/STATUS.md`, `ROADMAP.md`, `CHECKLISTS.md` mark share as cancelled.

## Question

Can we create a separate “encrypted” link per **folder** or **file**, send it to someone **without account access**, let them view, and **deactivate** the link later?

## Short answer

**Yes, technically** on current Supabase stack — but **not today**, and **not a TQ Must**. Needs a **server-side token resolver** (Edge Function or Vercel API + service role). Do **not** ship stubs or signed-URL-only “share.”

**Product decision:** out of plans for this take-home unless product owner reopens with full MVP budget (~12–20h).

## What “шифроване посилання” should mean here

| Meaning | Fit |
|---------|-----|
| Unguessable capability URL (`/s/<random>`) + TLS + revoke in DB | Recommended MVP (if ever greenlit) |
| Password on top of token | Phase 2 |
| E2E ciphertext in URL hash | Poor fit |

## Why it does not work out of the box

1. `AuthGate` blocks UI without session.  
2. RLS: rooms/nodes owner-only.  
3. Private Storage bucket + authenticated policies.  
4. No `share_links` / public `/s/:token` / Edge API.

## Preferred approach (archive)

`share_links` (token hash + `revoked_at`) + Edge/API with service role → public read-only `/s/:token` scoped to `root ∪ descendants`. Never put service role in `VITE_*`.

## Decision

**Cancelled for take-home.** Incomplete Share hurts polish score more than omitting it.
