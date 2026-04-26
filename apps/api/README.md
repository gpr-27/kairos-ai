# `apps/api` — Backend

Express + TypeScript + MongoDB + Clerk + Piston.
Hosted on Render.

## Quick start

```bash
pnpm install                 # from repo root
pnpm --filter api seed       # populate DB with sample problems
pnpm --filter api dev        # http://localhost:4000
```

Make sure your root `.env.local` has:

```
NODE_ENV=development
PORT=4000
WEB_ORIGIN=http://localhost:5173
MONGODB_URI=mongodb+srv://…/kairos
CLERK_SECRET_KEY=sk_test_…
PISTON_API_URL=https://emkc.org/api/v2/piston
```

## Scripts

```bash
pnpm --filter api dev        # tsx watch — instant restart on change
pnpm --filter api build      # tsc → dist/
pnpm --filter api start      # node dist/server.js (production)
pnpm --filter api seed       # idempotent problem upsert
pnpm --filter api lint       # eslint
pnpm --filter api typecheck  # tsc --noEmit
```

## Folder structure

```
src/
├── server.ts                Bootstrap (DB connect → app → listen)
├── app.ts                   Express factory + middleware mount
├── config/
│   ├── env.ts               Zod-validated env, exits on bad config
│   ├── database.ts          Mongoose connect/disconnect
│   └── logger.ts            Pino structured logger
├── middleware/
│   ├── auth.ts              Clerk middleware + helpers
│   ├── error-handler.ts     Global error handler + asyncHandler
│   └── validate.ts          Zod request validators
├── errors/
│   └── app-error.ts         AppError, NotFoundError, etc.
├── models/                  Mongoose schemas
├── services/                ★ Business logic (no req/res here)
├── routes/                  Thin controllers
└── scripts/
    └── seed-problems.ts     Idempotent seed
```

## Layered architecture

```
HTTP request
   │
   ▼
[middleware]  ─ helmet, cors, json, pinoHttp, rate-limit, clerk
   │
   ▼
[router]      ─ /api/v1/<resource>
   │
   ▼
[controller]  ─ parse + Zod validate → call service → return
   │
   ▼
[service]     ─ pure business logic, throws AppError, returns data
   │
   ▼
[model]       ─ Mongoose schemas
   │
   ▼
MongoDB
```

**Strict rules:**

- Controllers never touch Mongoose. They call services.
- Services never touch `req`/`res`. They take typed args and return typed data.
- Services throw `AppError` subclasses; the global handler maps them to HTTP.
- Anything that could fail async is wrapped in `asyncHandler`.

## Routes

| Method | Path                          | Auth     | Description                                       |
| ------ | ----------------------------- | -------- | ------------------------------------------------- |
| GET    | `/api/v1/health`              | -        | Liveness check                                    |
| GET    | `/api/v1/problems`            | optional | List problems (filter, search, paginate)          |
| GET    | `/api/v1/problems/:slug`      | optional | Single problem with examples + visible test cases |
| POST   | `/api/v1/submissions/run`     | required | Run user code against test cases via Piston       |
| GET    | `/api/v1/users/me`            | required | Current user profile (creates on first call)      |
| PATCH  | `/api/v1/users/me`            | required | Update profile                                    |
| POST   | `/api/v1/users/me/onboarding` | required | Complete onboarding                               |

Full request/response shapes live in [`packages/types/src/`](../../packages/types/src/).

## Adding an endpoint

1. **Type it** in `packages/types/src/<domain>.ts` (request + response, with Zod schema).
2. **Service** function in `apps/api/src/services/<domain>.service.ts`.
3. **Route** in `apps/api/src/routes/<domain>.routes.ts`:
   ```ts
   router.post(
     '/foo',
     requireUser,
     validateBody(FooRequestSchema),
     asyncHandler(async (req, res) => {
       const result = await fooService.doFoo(req.userId!, req.body);
       res.json(result);
     }),
   );
   ```
4. Mount it in `routes/index.ts` if it's a new file.

## Production

```bash
pnpm --filter api build
pnpm --filter api start
```

Render runs `pnpm install && pnpm build` then `pnpm start`.
The graceful shutdown handler closes Mongo connections on `SIGTERM`.
