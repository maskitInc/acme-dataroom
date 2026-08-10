# STATUS — human-facing

| | |
|--|--|
| **Now** | **Ready for hand-in** — reviewer password demo (no email rate limit) |
| **Left** | Owner optional: smoke password login on live after deploy |
| **Progress** | ~95%+ |
| **Not planned** | Share links; raising built-in magic-link quota without SMTP |
| **Reviewer login** | `reviewer@acme-dataroom.app` / `AcmeReview2026!` (Password tab) |

## Links

- **Live:** https://tailored-tech-test-gamma.vercel.app
- **GitHub:** https://github.com/maskitInc/acme-dataroom
- **Supabase:** https://supabase.com/dashboard/project/chsepsbqkfyakjqrktzy
- **Readiness + code review:** [`READINESS.md`](./READINESS.md)

## Phase D order (owner priority) — complete

| # | Stage | Status |
|---|-------|--------|
| 17 | Full-text: extract PDF text on upload + search UI | done |
| 18 | Ship FTS to prod | done |
| 19 | Supabase Postgres + Storage (replace/augment IDB) | done |
| 20 | Wire app to Supabase repo adapter | done |
| 21 | Auth (Supabase magic link / OAuth) | done (magic link) |
| 22 | Ship Supabase+Auth to prod | done |

## Explicitly cancelled

| Idea | Why |
|------|-----|
| Per-file/folder share links + revoke | TQ/SPEC non-goal; needs Edge/API (~12–20h); fake Share = polish fail. Research archived: `docs/research/11-share-links-capability-urls.md` |
| OAuth | Optional; magic link enough for extra credit |
