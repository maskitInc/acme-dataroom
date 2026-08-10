# Access needed from owner

| Service | Need for Must MVP? | Status |
|---------|-------------------|--------|
| **GitHub** | Yes | ✅ https://github.com/maskitInc/acme-dataroom |
| **Vercel** | Yes | ✅ https://tailored-tech-test-gamma.vercel.app |
| **GitHub ↔ Vercel** | Nice (auto-deploy on push) | ✅ connected manually by owner |
| **Supabase** | Phase D | ✅ project `chsepsbqkfyakjqrktzy` (Acme Data Room) |

**Project:** `tailored-tech-test` under `maksyms-projects-d65b07f5`  
**Production aliases:** `tailored-tech-test-gamma.vercel.app` (+ team aliases)

**Env (Vercel + local `.env.local`):**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (publishable / anon — never secret/service_role in client)

## Reviewer demo account (Auth)

| Email | Password | Notes |
|-------|----------|--------|
| `reviewer@acme-dataroom.app` | `AcmeReview2026!` | Confirmed via Admin API; no magic-link email required |

Created so take-home reviewers bypass Supabase built-in mailer (~2 emails/hour). Optional later: Resend free SMTP → raise `rate_limit_email_sent` to 30+.

## Owner emails in Auth (do not invent others)

Only touch emails the owner explicitly allows. Current intentional users may include `maskit.inc@gmail.com` + the reviewer demo above.
