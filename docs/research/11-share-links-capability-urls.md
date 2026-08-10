# 11 — Share links (capability URLs + revoke)

**Status:** Research only — **defer** unless greenlit as full stretch.  
**Date:** 2026-08-10  
**Related:** SPEC §2.2 non-goal (sharing/permissions); TQ optional = deploy/auth/search only (no share).

## Question

Can we create a separate “encrypted” link per **folder** or **file**, send it to someone **without account access**, let them view, and **deactivate** the link later?

## Short answer

**Yes, technically** on current Supabase stack — but **not today**, and **not a TQ Must**. Needs a **server-side token resolver** (Edge Function or Vercel API + service role). Do **not** ship stubs or signed-URL-only “share.”

## What “шифроване посилання” should mean here

| Meaning | Fit |
|---------|-----|
| Unguessable capability URL (`/s/<random>`) + TLS + revoke in DB | **Recommended MVP** |
| Password on top of token | Phase 2 |
| E2E ciphertext in URL hash | Poor fit (big PDFs, weak revoke, fights auth hash) |

Honest product copy: anyone with the link can view until owner deactivates; treat link like a secret.

## Why it does not work out of the box

1. `AuthGate` blocks UI without session.  
2. RLS: rooms/nodes owner-only (`auth.uid()`).  
3. Bucket `dataroom-files` private; storage policies `authenticated` + owner path prefix.  
4. No `share_links` table; no public `/s/:token` route; no API/Edge in repo.

Anonymous cannot list nodes or download PDFs.

## Approach comparison

| Option | File | Folder | Instant revoke | Notes |
|--------|------|--------|----------------|-------|
| A. Storage `createSignedUrl` | Yes | No | Weak (TTL) | Demo only |
| **B. `share_links` + Edge/API (service role)** | Yes | Yes | **Yes** | **Preferred** |
| C. WebCrypto in fragment | Awkward | No | No | Wrong model |
| D. Vercel `/api` + service role | Yes | Yes | Yes | Same as B, different host |

**Never** put service role in `VITE_*`.

## MVP design (if greenlit)

**Schema:** `share_links(id, token_hash, dataroom_id, root_node_id, created_by, created_at, expires_at?, revoked_at?)` — store **hash** of token, not raw token.

**Server:** validate token → load root → if folder, expose only `root ∪ descendants` (reuse `collectDescendants` idea) → short-lived signed URL or proxied PDF bytes.

**UI:** row menu “Copy link” / “Manage links” → Deactivate sets `revoked_at`. Public shell `/s/:token` **before** AuthGate (read-only outline + PDF preview). No upload/edit via share.

**Out of scope v1:** password, view caps, watermark, guest accounts, IDB-mode shares, room-wide ACL.

## Effort

| Scope | Hours |
|-------|-------|
| File signed URL, no revoke | 2–4 (not product-grade) |
| File + folder + `/s/:token` + deactivate | **12–20** |
| + password / polish | +6–10 |

## Decision

| Call | When |
|------|------|
| **Defer (default)** | SPEC non-goal; incomplete Share hurts polish score |
| Document stretch | README / this note |
| **Go** | Only if owner wants VDR demo **and** full MVP ships |

## Next task formulation (copy-ready)

> **Stretch: capability share links** — Add per-file and per-folder share links: owner creates unguessable `/s/:token` URL; recipient without login can browse the shared folder subtree (or open one PDF) read-only; owner can deactivate the link immediately. Implement via `share_links` table (token hash + `revoked_at`) and a trusted Edge Function or Vercel API using the service role (never in the client). Reuse outline + PDF preview for the public viewer. No stub Share buttons. Optional later: password, expiry, view count.

## References

- `docs/test-task.md` — optional extra credit (no share)  
- `docs/SPEC.md` — sharing non-goal; no fake Share nav  
- `supabase/migrations/20260810143000_dataroom_schema.sql` — RLS + private bucket  
- `src/main.tsx` — AuthGate  
- `src/domain/cascade.ts`, `src/domain/tree.ts` — subtree boundary  
