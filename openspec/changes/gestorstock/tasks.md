# Tasks: GestorStock MVP Sprint 0-1

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~1800-2100 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (Foundation) → PR 2 (Auth Backend) → PR 3 (Auth Frontend + Shell) → PR 4 (Testing) |
| Delivery strategy | auto-chain |
| Chain strategy | stacked-to-main |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: stacked-to-main
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Monorepo + backend + frontend scaffolding, DB schema, health check | PR 1 | main branch; ~600 lines; independently deployable |
| 2 | JWT auth backend: login, refresh, logout, middleware | PR 2 | depends on PR 1; ~450 lines; testable via curl/insomnia |
| 3 | Auth frontend + app shell: login page, auth context, layout, nav | PR 3 | depends on PR 2; ~580 lines; first visual deliverable |
| 4 | Backend + frontend tests | PR 4 | depends on PR 3; ~450 lines; verification layer |

## Phase 1: Foundation (PR 1 — ~600 lines)

- [x] 1.1 Create root `package.json` with npm workspaces (`frontend/`, `backend/`), root `tsconfig.base.json`, `.gitignore`, `.env.example` — Files: `package.json`, `tsconfig.base.json`, `.gitignore`, `.env.example` (~40 lines)
- [x] 1.2 Scaffold backend: `backend/package.json` (express, prisma, zod, bcrypt, jsonwebtoken, helmet, cors, compression), `backend/tsconfig.json` extending base, `backend/src/config/env.ts` (Zod env validation for DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, PORT, NODE_ENV, CORS_ORIGIN) — Files: `backend/package.json`, `backend/tsconfig.json`, `backend/src/config/env.ts` (~80 lines) — Depends: 1.1
- [x] 1.3 Create Prisma schema with 6 entities (User, Category, Product, StockMovement, Supplier, WorkOrder), 4 enums (UserRole, MovementType, WorkOrderStatus, ProductCondition), UUID PKs, timestamps, indexes, cascade rules — Files: `backend/prisma/schema.prisma` (~130 lines) — Depends: 1.2
- [x] 1.4 Create seed script for admin user (bcrypt-hashed password from env), run initial migration — Files: `backend/prisma/seed.ts` (~50 lines) — Depends: 1.3 — NOTE: migration not run (per instructions); user runs `npx prisma migrate dev`
- [x] 1.5 Create backend entry `backend/src/app.ts` + `backend/src/server.ts` with middleware stack (helmet, CORS, compression, JSON 10MB limit), Prisma client singleton `backend/src/config/database.ts`, custom error classes `backend/src/utils/errors.ts`, structured response helper `backend/src/utils/response.ts`, global error handler — Files: `backend/src/app.ts`, `backend/src/server.ts`, `backend/src/config/database.ts`, `backend/src/utils/errors.ts`, `backend/src/utils/response.ts` (~120 lines) — Depends: 1.2 — DEVIATION: split index.ts into app.ts (Express config) + server.ts (listen) for testability
- [x] 1.6 Create health check route `GET /api/health` with DB ping, Zod validation middleware — Files: `backend/src/routes/health.ts`, `backend/src/middleware/validate.ts` (~60 lines) — Depends: 1.5
- [x] 1.7 Scaffold frontend: `frontend/package.json` (@tanstack/react-start, @tanstack/react-router, @tanstack/react-query, tailwindcss 4, clsx, tailwind-merge), `frontend/tsconfig.json`, `frontend/vite.config.ts` (router plugin + API proxy), `frontend/app/styles/app.css` (Tailwind 4 import + semantic theme tokens), `frontend/app/lib/cn.ts` — Files: `frontend/package.json`, `frontend/tsconfig.json`, `frontend/vite.config.ts`, `frontend/app/styles/app.css`, `frontend/app/lib/cn.ts` (~100 lines) — Depends: 1.1 — Parallel with: 1.2-1.6 — DEVIATION: no app.config.ts needed (latest TanStack Start RC handles config via vite plugin)
- [x] 1.8 Create frontend route skeleton: `frontend/app/router.tsx`, `frontend/app/routes/__root.tsx` (outlet + error boundary), `frontend/app/routes/index.tsx` (landing), `frontend/app/routes/login.tsx` (placeholder), `frontend/app/routes/_authenticated.tsx` (placeholder), `frontend/app/routes/_authenticated.dashboard.tsx` (placeholder), `frontend/app/routes/$.tsx` (404) — Files: 7 route/entry files (~80 lines) — Depends: 1.7 — DEVIATION: no client.tsx/ssr.tsx needed (latest TanStack Start RC handles entry points via vite plugin)

## Phase 2: Auth Backend (PR 2 — ~450 lines)

- [ ] 2.1 Create JWT utilities (sign access 15min/refresh 7d with HS256, verify, payload types) and password helpers (hash with bcrypt 12 rounds, compare) — Files: `backend/src/utils/jwt.ts`, `backend/src/utils/password.ts` (~60 lines) — Depends: 1.5
- [ ] 2.2 Create auth service: login (verify credentials, issue tokens, store refresh token hash), refresh (validate token, detect replay → revoke all, rotate), logout (revoke token), getCurrentUser — Files: `backend/src/services/auth.service.ts`, `backend/src/services/user.service.ts` (~150 lines) — Depends: 2.1, 1.3
- [ ] 2.3 Create Zod auth schemas (login, createUser, refresh response), auth routes (POST /api/auth/login, POST /api/auth/refresh, POST /api/auth/logout, GET /api/auth/me), refresh token in httpOnly cookie (Secure, SameSite=Strict, Path=/api/auth) — Files: `backend/src/schemas/auth.schema.ts`, `backend/src/routes/auth.ts` (~120 lines) — Depends: 2.2
- [ ] 2.4 Create auth middleware (extract Bearer token, verify JWT, attach req.user), role middleware (check UserRole against allowed list), rate limiter (express-rate-limit: 100/min general, 5/min on auth routes) — Files: `backend/src/middleware/auth.ts`, `backend/src/middleware/role.ts`, `backend/src/middleware/rate-limit.ts` (~80 lines) — Depends: 2.1
- [ ] 2.5 Wire auth routes into `backend/src/index.ts` with rate limiting, add POST /api/users (admin-only create user) — Files: `backend/src/index.ts`, `backend/src/routes/users.ts` (~40 lines) — Depends: 2.3, 2.4

## Phase 3: Auth Frontend + App Shell (PR 3 — ~580 lines)

- [ ] 3.1 Create API client `frontend/app/lib/api-client.ts` — fetch wrapper that attaches Bearer token from memory, intercepts 401, calls POST /api/auth/refresh (cookie sent automatically), retries original request, clears state on refresh failure — Files: `frontend/app/lib/api-client.ts` (~80 lines) — Depends: 1.8
- [ ] 3.2 Create AuthContext provider `frontend/app/lib/auth-context.tsx` — stores user + access token in memory (React state/ref), exposes login/logout/refreshToken, initializes from GET /api/auth/me on mount, provides useAuth() hook — Files: `frontend/app/lib/auth-context.tsx` (~120 lines) — Depends: 3.1
- [ ] 3.3 Create login page `frontend/app/routes/login.tsx` — mobile-first form with email/password inputs (44px min height), inline validation (Zod), loading state on submit, error display, redirect to saved path or dashboard on success — Files: `frontend/app/routes/login.tsx`, `frontend/app/components/ui/button.tsx`, `frontend/app/components/ui/input.tsx` (~140 lines) — Depends: 3.2
- [ ] 3.4 Implement `_authenticated.tsx` pathless layout with `beforeLoad` guard (check auth context, redirect to /login?redirect= if unauthenticated), compose TopBar + scrollable Outlet + BottomNav — Files: `frontend/app/routes/_authenticated.tsx` (~60 lines) — Depends: 3.2
- [ ] 3.5 Create BottomNav component — fixed bottom, 4 items (Dashboard, Products, Movements, Menu), icons + labels, active state via router matching, 44px touch targets, hidden outside _authenticated — Files: `frontend/app/components/layout/bottom-nav.tsx` (~70 lines) — Depends: 1.8
- [ ] 3.6 Create TopBar component — fixed top, "GestorStock" title, user avatar/initials from auth context, 44px touch targets, hidden outside _authenticated — Files: `frontend/app/components/layout/top-bar.tsx` (~50 lines) — Depends: 3.2
- [ ] 3.7 Update `__root.tsx` — wrap with QueryClientProvider + AuthProvider, add global ErrorBoundary with retry button, add loading states for route transitions — Files: `frontend/app/routes/__root.tsx`, `frontend/app/lib/query-client.ts` (~60 lines) — Depends: 3.2

## Phase 4: Testing (PR 4 — ~450 lines)

- [ ] 4.1 Backend unit tests — auth service (login success/failure, refresh rotation, replay detection, logout), JWT utils (sign/verify/expired), password utils, env validation (missing/invalid vars) — Files: `backend/src/__tests__/auth.service.test.ts`, `backend/src/__tests__/jwt.test.ts`, `backend/src/__tests__/env.test.ts` (~150 lines) — Depends: Phase 2
- [ ] 4.2 Backend integration tests — POST /api/auth/login (valid/invalid/disabled), POST /api/auth/refresh (valid/expired/replay), POST /api/auth/logout, GET /api/health (db up/down), rate limiting on auth endpoints — Files: `backend/src/__tests__/integration/auth.test.ts`, `backend/src/__tests__/integration/health.test.ts` (~150 lines) — Depends: Phase 2
- [ ] 4.3 Frontend component tests — LoginForm (validation, loading, error, redirect), BottomNav (active state, navigation, hidden on login), TopBar (render with user, hidden on login), AuthProvider (token refresh, redirect on expiry) — Files: `frontend/app/__tests__/login.test.tsx`, `frontend/app/__tests__/bottom-nav.test.tsx`, `frontend/app/__tests__/auth-context.test.tsx` (~150 lines) — Depends: Phase 3

## Parallelization Map

```
1.1 ──┬── 1.2 ── 1.3 ── 1.4
      │         └── 1.5 ── 1.6 ───────────── 2.1 ── 2.2 ── 2.3 ─┬── 2.5
      │                 └─────────────────── 2.4 ─────────────────┘
      └── 1.7 ── 1.8 ── 3.1 ── 3.2 ──┬── 3.3
                                      ├── 3.4
                                      ├── 3.6
                                      └── 3.5 (parallel from 1.8)
```

Parallel opportunities:
- 1.2-1.6 (backend) ‖ 1.7-1.8 (frontend) after 1.1
- 2.1 ‖ 2.4 after 1.5 + 1.3
- 3.3 ‖ 3.4 ‖ 3.5 ‖ 3.6 after 3.2
- 4.1 ‖ 4.2 ‖ 4.3 (all test phases independent)
