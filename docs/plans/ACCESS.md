# Access needed from owner

| Service | Need for Must MVP? | Status | What owner does if blocked |
|---------|-------------------|--------|------------------------------|
| **GitHub (`gh`)** | Yes (deliverable repo) | ✅ CLI logged in as `maskitInc` | — |
| **Vercel** | Yes (hosted URL) | ❌ CLI not installed / not logged in | Install + `npx vercel login` **або** connect GitHub repo in Vercel dashboard and grant agent deploy token |
| **Supabase** | **No** (Option A = IndexedDB) | N/A | Only if we do Extra after Must ship |
| AWS / R2 | No | N/A | — |

Agent will try: `npm i -g vercel` or `npx vercel` + login when reaching deploy. If interactive login required → **only then** stop and ask owner.
