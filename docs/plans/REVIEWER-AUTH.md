# Free auth for reviewers (no SMTP)

**Problem:** Supabase built-in mailer ≈ **2 magic links / hour**. Cannot set 5–10 without custom SMTP.

**Solution shipped:** password sign-in + public demo account (Admin `email_confirm`, **zero emails sent**).

| Field | Value |
|-------|--------|
| Email | `reviewer@acme-dataroom.app` |
| Password | `AcmeReview2026!` |
| UI | AuthGate → **Password** (pre-filled) |

Unlimited sign-ins for whoever grades the take-home.

**Cheatsheet:** [`../../ACCESS.md`](../../ACCESS.md)

## Optional later: real magic links ≥5–10/hr

1. Create free [Resend](https://resend.com) account + API key  
2. Dashboard → Auth → SMTP (or Management API) with Resend host `smtp.resend.com`  
3. Set `rate_limit_email_sent` to 30  

Until then: magic link stays secondary; password demo is the reviewer path.
