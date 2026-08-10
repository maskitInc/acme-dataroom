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
