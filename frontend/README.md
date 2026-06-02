# `frontend` — Frontend

React 18 + Vite + TypeScript + Tailwind v4 + shadcn/ui.
Hosted on Vercel.

## Quick start

```bash
pnpm install                 # from repo root
pnpm --filter web dev        # http://localhost:5173
```

Make sure your root `.env.local` has:

```
VITE_CLERK_PUBLISHABLE_KEY=pk_test_…
VITE_API_BASE_URL=http://localhost:4000
VITE_ML_BASE_URL=http://localhost:8000
VITE_SOCKET_URL=http://localhost:4000
VITE_APP_ENV=development
VITE_LLM_PROVIDER=groq
VITE_DEFAULT_MODEL=…
VITE_AVAILABLE_MODELS=…
```

## Scripts

```bash
pnpm --filter web dev        # Vite dev server
pnpm --filter web build      # production bundle → dist/
pnpm --filter web preview    # serve production build locally
pnpm --filter web lint       # eslint
pnpm --filter web typecheck  # tsc --noEmit
```

## Folder structure

```
src/
├── App.tsx                 Top-level router with Suspense + auth guards
├── main.tsx                React mount + provider tree
├── routes/                 One file per page (lazy-loaded)
├── components/
│   ├── ui/                 shadcn-style primitives
│   ├── auth/               <ProtectedRoute>, <PublicOnlyRoute>
│   ├── brand/              Logo
│   ├── layout/             AppLayout, Navbar
│   └── solver/             ★ Three-pane solver
├── lib/
│   ├── env.ts              Zod-validated environment
│   ├── api-client.ts       Typed fetch with Clerk Bearer JWT
│   └── utils.ts            cn(), formatters
├── providers/              Theme provider
├── data/                   Frontend-only mock data (fallback)
└── styles/                 globals.css + Tailwind theme
```

## Adding a route

1. Create `src/routes/my-page.tsx` exporting a default React component.
2. In `src/App.tsx`, lazy-load it:
   ```tsx
   const MyPage = lazy(() => import('@/routes/my-page'));
   ```
3. Add a `<Route path="/my-page" element={<MyPage />} />` inside the right guard (public, protected, or layout).
4. Add a nav link in `src/components/layout/navbar.tsx` if user-facing.

## Adding a UI primitive

Follow shadcn/ui conventions — copy a primitive **into** the codebase rather than installing a library.

1. Create `src/components/ui/<name>.tsx`.
2. Export it. Use `cn()` from `@/lib/utils` for class merging.
3. Type the props (`React.ComponentProps<…>` is your friend).

## Conventions

- **TanStack Query** for any server data. **Never** use `useState` + `useEffect` for fetching.
- **Zustand** for cross-route UI state. Local state stays in `useState`.
- **Form state**: `react-hook-form` + Zod resolver.
- **Imports**: `@/…` for app code, `@kairos/types` for shared types.
- **No inline styles**, no `style={…}` — use Tailwind classes.

## Production build

```bash
pnpm --filter web build
```

Output is a static SPA in `frontend/dist/`. Vercel deploys this directly.
The `vercel.json` rewrites all routes to `/index.html` for client-side routing.
