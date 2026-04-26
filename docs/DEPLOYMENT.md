# Deployment

> Production paths for **$0/month** with room to upgrade later.

## Architecture in production

```
              ┌────────────────────┐
              │  Cloudflare DNS    │  (optional, for custom domain)
              └─────────┬──────────┘
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
┌───────────────┐ ┌───────────┐ ┌────────────────┐
│ Vercel (web)  │ │  Render   │ │  HF Spaces     │
│ kairos.ai     │ │  api.…    │ │  ml.…          │
└───────────────┘ └─────┬─────┘ └────────┬───────┘
                        │                │
                        ▼                ▼
                  MongoDB Atlas     Groq / HF Hub
```

## 1. MongoDB Atlas

1. Sign up at [cloud.mongodb.com](https://cloud.mongodb.com).
2. Create a free **M0 cluster** (any region near your users).
3. **Database Access** → add user `kairos_admin` with a strong password (NOT `gpr` — see [SECURITY.md](./SECURITY.md)).
4. **Network Access** → for now, allow `0.0.0.0/0`. After Render is set up, restrict to Render's egress IPs.
5. Copy the connection string. Replace `<password>` and append `/kairos`:
   ```
   mongodb+srv://kairos_admin:<password>@kairos-cluster.xyz.mongodb.net/kairos?retryWrites=true&w=majority&appName=kairos-cluster
   ```

## 2. Clerk

1. Sign up at [clerk.com](https://clerk.com).
2. Create an application named `Kairos AI`.
3. **API Keys**: copy `Publishable key` and `Secret key`.
4. **Authentication → Email, Phone, Username** → enable **Email + Password** and **Email verification (link)**.
5. **Authentication → Social Connections** → enable Google + GitHub.
6. **Paths**:
   - Sign-in URL: `/sign-in`
   - Sign-up URL: `/sign-up`
   - After sign-in: `/dashboard`
   - After sign-up: `/onboarding`

## 3. ML service → HuggingFace Spaces

1. Sign up at [huggingface.co](https://huggingface.co).
2. **Settings → Access Tokens** → create a `write` token. Save it as `HUGGINGFACE_TOKEN`.
3. Create a new **Space**:
   - Owner: your username
   - Name: `kairos-ml`
   - SDK: **Docker**
   - Hardware: **CPU basic** (free) — switch to **ZeroGPU** later when fine-tuned model lands
4. Push the `apps/ml/` folder as the Space's root:
   ```bash
   cd apps/ml
   git init
   git remote add space https://huggingface.co/spaces/<your-username>/kairos-ml
   git push space main
   ```
5. In the Space's **Settings → Variables and secrets**, add:
   - `GROQ_API_KEY`
   - `LLM_PROVIDER=groq`
   - `WEB_ORIGIN=https://kairos.vercel.app` (update after Vercel deploy)
6. Wait for the build (~3 min). Test:
   ```bash
   curl https://<your-username>-kairos-ml.hf.space/health
   ```

## 4. API → Render

1. Sign up at [render.com](https://render.com).
2. **New → Web Service** → connect your GitHub repo.
3. Render auto-detects `render.yaml`. Confirm:
   - Root Directory: `apps/api`
   - Build: `pnpm install && pnpm build`
   - Start: `pnpm start`
4. **Environment** → add:
   - `MONGODB_URI` (from step 1)
   - `CLERK_SECRET_KEY` (from step 2)
   - `WEB_ORIGIN` (will be `https://<your-vercel-app>.vercel.app`)
   - `NODE_ENV=production`
5. Deploy. Once live, copy the URL (e.g. `https://kairos-api.onrender.com`).
6. **MongoDB Atlas → Network Access** → add Render's egress IPs (under your Render service → Settings).

## 5. Web → Vercel

1. Sign up at [vercel.com](https://vercel.com).
2. **Add New → Project** → import your GitHub repo.
3. **Framework**: Vite.
4. **Root Directory**: `apps/web`.
5. **Build & Output Settings**: defaults are fine (Vercel reads `vercel.json`).
6. **Environment Variables**:
   - `VITE_CLERK_PUBLISHABLE_KEY` (from step 2)
   - `VITE_API_BASE_URL=https://kairos-api.onrender.com` (from step 4)
   - `VITE_ML_BASE_URL=https://<your-username>-kairos-ml.hf.space` (from step 3)
7. Deploy. Copy the URL.

## 6. Loop back

- Update Render's `WEB_ORIGIN` env var to the Vercel URL → trigger a redeploy.
- Update HF Space's `WEB_ORIGIN` env var → restart the Space.

## 7. Smoke test

```bash
# Health
curl https://kairos-api.onrender.com/api/v1/health
curl https://<user>-kairos-ml.hf.space/health

# Sign up via the UI, sign in, open Two Sum, type code, run it, ask the AI for a hint.
```

## 8. Optional: custom domain

1. Buy a domain (Cloudflare Registrar = at-cost).
2. **Vercel → Domains** → add `kairos.ai` (or whatever).
3. **Clerk → Domains** → add `kairos.ai` and the API origin.
4. Cloudflare DNS → CNAME the apex to Vercel.

## Costs (per month)

| Service       | Tier                     | Cost                         |
| ------------- | ------------------------ | ---------------------------- |
| MongoDB Atlas | M0 (512MB)               | $0                           |
| Clerk         | Free (10k MAU)           | $0                           |
| Vercel        | Hobby                    | $0                           |
| Render        | Free                     | $0 (sleeps after 15min idle) |
| HF Spaces     | CPU basic                | $0                           |
| Groq          | Free tier (rate-limited) | $0                           |
| **Total**     |                          | **$0**                       |

**When to upgrade:**

- > 100 active users/day → Render Starter ($7) to remove cold starts
- > 10k chats/day → Groq paid tier or fine-tuned HF Space (still free with ZeroGPU)
- > 1GB DB → Atlas M2 ($9)
- Custom domain → ~$10/year for the domain itself
