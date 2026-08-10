# Access cheatsheet — Acme Data Room

**Швидкий пошук доступів.** Один файл для рев’юера і для себе.

---

## Live app

| | |
|--|--|
| **URL** | https://tailored-tech-test-gamma.vercel.app |
| **Repo** | https://github.com/maskitInc/acme-dataroom |

---

## Reviewer login (рекомендовано)

Без magic link / без SMTP. На екрані входу вкладка **Password** (поля вже префіл).

| | |
|--|--|
| **Email** | `reviewer@acme-dataroom.app` |
| **Password** | `AcmeReview2026!` |

Чому не лише magic link: built-in Supabase mailer ≈ **2 листи/год**; password — без ліміту.

Деталі + повний чеклист доступів: [`ACCESS.md`](../../ACCESS.md) · [`REVIEWER-AUTH.md`](./REVIEWER-AUTH.md)

---

## Services

| Service | Link / id | Notes |
|---------|-----------|--------|
| **GitHub** | https://github.com/maskitInc/acme-dataroom | source |
| **Vercel** | project `tailored-tech-test` (team `maksyms-projects-d65b07f5`) | prod alias `*-gamma.vercel.app` |
| **Supabase** | project `chsepsbqkfyakjqrktzy` (Acme Data Room) | Auth + DB + Storage |

### Client env (Vercel + `.env.local`)

```bash
VITE_SUPABASE_URL=https://chsepsbqkfyakjqrktzy.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=…   # anon / publishable only — never service_role
```

Template: [`.env.example`](./.env.example)

### Local without cloud

Omit env → IndexedDB (no AuthGate).

---

## Owner Auth users

Не створювати/не чіпати чужі мейли без явного дозволу.

| Email | Role |
|-------|------|
| `reviewer@acme-dataroom.app` | take-home demo (password) |
| `maskit.inc@gmail.com` | owner (якщо є) |

---

## Agent / CLI (owner)

| Need | How |
|------|-----|
| Supabase Management API | Dashboard → [Account tokens](https://supabase.com/dashboard/account/tokens) → `supabase login --token 'sbp_…'` |
| Raise magic-link quota ≥5–10/hr | Custom SMTP (e.g. Resend) required — see REVIEWER-AUTH.md |

---

## Related docs

- Status: [`docs/plans/STATUS.md`](./docs/plans/STATUS.md)
- Readiness review: [`docs/plans/READINESS.md`](./docs/plans/READINESS.md)
- Plans index: [`docs/plans/README.md`](./docs/plans/README.md)
