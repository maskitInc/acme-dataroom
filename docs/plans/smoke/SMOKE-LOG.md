# Live OTP smoke log — 2026-08-10

**URL:** https://tailored-tech-test-gamma.vercel.app

| Step | Result | Evidence |
|------|--------|----------|
| Prod HTTP 200 | PASS | Vercel HTML + JS/CSS 200 |
| AuthGate renders | PASS | Email field + “Send magic link”; no console errors |
| Email provider enabled | PASS | `/auth/v1/settings` → `external.email: true` |
| OTP API accept | PASS | `POST /auth/v1/otp?redirect_to=…gamma.vercel.app` → **200** |
| UI “Link sent” | PASS | After submit: “Open the email we sent to mkubyshkin.ibexa@comwrap.com…” |
| Unit tests | PASS | 25/25 |
| Magic-link click → session | **OWNER** | Open inbox, click link (cannot automate inbox) |
| Post-login CRUD | **OWNER** | After session: Load sample → upload → search → move |

## Auth settings (public)

- `mailer_autoconfirm: true`
- `disable_signup: false`
- OAuth providers: all false (magic link only) — OK for TQ

## Ready to submit?

**Almost.** OTP **send** path is green. Final gate = owner confirms email arrives and login lands on room list.
