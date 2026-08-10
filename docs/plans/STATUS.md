# STATUS — human-facing

| | |
|--|--|
| **Now** | **Submission-ready** — Must + Phase B/C/D done |
| **Left** | Live magic-link smoke for reviewers; optional tiny polish (not blockers) |
| **Progress** | ~91% (see [`READINESS.md`](./READINESS.md)) |
| **Not planned** | Share / capability links / permissions ACL — cancelled (SPEC non-goal) |
| **Need from you** | Confirm OTP email on live; hand-in when smoke OK |

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
