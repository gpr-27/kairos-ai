# Security policy

## Reporting a vulnerability

If you find a security issue, **please do not open a public issue.**
Email `praneeth.gpr27@gmail.com` with:

- A clear description and reproduction steps
- The component affected (`web`, `api`, `ml`, infra)
- Your assessment of impact

You'll get an acknowledgment within **48 hours** and, where possible, a fix within **7 days** before public disclosure.

## Hardening checklist (what we already do)

### Secrets

- ✅ All secrets live in `.env.local` (gitignored) or platform secret stores (Vercel, Render, HF Spaces).
- ✅ `.env.example` only contains placeholders.
- ✅ No secret has ever been committed. If one is, it's rotated immediately.
- ✅ Server-only secrets (e.g. `CLERK_SECRET_KEY`, `MONGODB_URI`) are never sent to the browser.

### Authentication

- ✅ Auth is delegated entirely to Clerk — we never store passwords.
- ✅ Email verification is enforced before account activation.
- ✅ Session JWTs are short-lived; refresh handled by Clerk.
- ✅ All non-public routes require a verified Clerk session.

### Transport + headers

- ✅ HTTPS is enforced by every host (Vercel, Render, HF Spaces).
- ✅ `helmet()` sets standard headers: `X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`, etc.
- ✅ CORS is **allowlist only** — `ALLOWED_ORIGINS` env var, default-deny.
- ✅ Cookies are `httpOnly`, `secure`, `sameSite=lax`.

### Input validation

- ✅ Every API endpoint validates body / params / query with **Zod** before reaching service code.
- ✅ Rejected requests return a structured `{ error, code, details }` response.

### Rate limiting + abuse

- ✅ `express-rate-limit` at 120 requests/minute/IP in production.
- ✅ Heavier limits planned for `/submissions/run` (8/min/user).
- ⏳ Cloudflare Turnstile in front of sign-up (Week 1).

### Code execution

- ✅ User code never runs on our servers — it runs on **Piston** (Docker-isolated, time-limited, memory-capped).
- ✅ Stdin/stdout are streamed; no filesystem access from user code.
- ⏳ Per-user execution budget tracked in Mongo (Week 1).

### Database

- ✅ MongoDB Atlas with IP allowlist (in production: only Render's egress IPs).
- ✅ Database user has the minimum required role (`readWrite` on the single `kairos` DB).
- ✅ All queries use Mongoose schemas — no string interpolation, no raw `$where`.
- ✅ Backups handled by Atlas (daily snapshots on M0).

### Dependencies

- ✅ `pnpm audit` runs in CI. PRs that introduce critical vulns are blocked.
- ✅ Dependabot enabled for `npm` and `pip`.
- ⏳ Snyk weekly scan (Week 2).

### Logging + observability

- ✅ No PII in logs. We log Clerk `userId`, never email/name.
- ✅ Structured JSON logs (Pino + Loguru) for grepability.
- ✅ Errors carry a request-correlation `requestId`.

## What we do _not_ protect against (yet)

- **DDoS at scale** — we rely on the host's protection (Cloudflare for Vercel; Render's edge).
- **Sophisticated prompt injection** — model output is rendered as Markdown (no HTML, no code execution from text).
- **Account takeover via OAuth provider compromise** — that's Clerk's threat model.
- **Side-channel attacks on Piston** — out of our scope.

## Public-key-only secrets

These are **safe to expose** in the browser:

- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk's public key (`pk_test_…` / `pk_live_…`)
- `VITE_API_BASE_URL` — your public API URL
- `VITE_ML_BASE_URL` — your public ML URL

Anything else **must stay server-side**.

## Incident: April 2026 leak

During development, the following keys were accidentally pasted into a chat:

- `gsk_…` (Groq)
- `sk_test_…` (Clerk secret)
- `mongodb+srv://kairos_admin:gpr@…` (MongoDB)
- `hf_…` (HuggingFace)

**All four were rotated immediately.** New keys live only in `.env.local` and platform secret stores. Old keys are revoked at their respective providers and will not work.

Lesson: **never paste secrets in chat — even an "AI" chat.** Always use `.env.local` and tell the assistant the variable name, not the value.
