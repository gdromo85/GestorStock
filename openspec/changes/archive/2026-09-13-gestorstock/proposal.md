# Proposal: GestorStock MVP — Sprint 0-1 (Scaffolding + Auth)

## Intent

Bootstrap the GestorStock monorepo (TanStack Start frontend + Express/Prisma backend) and deliver working JWT authentication. This establishes the development foundation and the first vertical slice: a user can log in from a mobile device and reach a protected dashboard shell.

## Scope

### In Scope

**Sprint 0 — Scaffolding:**
- Monorepo structure (`frontend/` + `backend/`)
- TanStack Start + Vite + TypeScript strict mode
- Tailwind CSS 4 with `cn()` utility and semantic theme
- Express server with helmet, CORS, compression, error handling
- Prisma ORM with full schema (all 6 entities) + initial migration
- PostgreSQL VPS connection with env validation (Zod)
- Mobile-first app shell: BottomNav, TopBar, FAB placeholder
- File-based routing skeleton (TanStack Router)

**Sprint 1 — Authentication:**
- User model + Prisma seed for admin user
- JWT auth: login, refresh token, logout endpoints
- bcrypt password hashing (salt rounds >= 12)
- Auth middleware + Zod request validation
- Login page (mobile-optimized, touch-friendly inputs)
- Protected route layout (`_authenticated` pathless route)
- Role-based access (ADMIN, MANAGER, MECHANIC)
- Auth context + token refresh on frontend

### Out of Scope
- Product/Category/Stock CRUD (Sprint 2)
- Stock Movements + Dashboard data (Sprint 3)
- Suppliers + Work Orders (Sprint 4)
- Offline support, barcode scanning, reports (Phase 2)
- Docker/CI-CD setup
- Testing infrastructure (added per-sprint as needed)

## Capabilities

### New Capabilities
- `app-scaffolding`: Monorepo setup, build tooling, DB connection, Prisma schema, env validation
- `user-auth`: JWT authentication flow, password hashing, role-based access, token refresh
- `app-shell`: Mobile-first layout with BottomNav, TopBar, protected route guard, responsive breakpoints

### Modified Capabilities
None (greenfield project).

## Approach

Monorepo with `frontend/` (TanStack Start) and `backend/` (Express + Prisma). Server functions via `createServerFn` for data fetching. JWT with 15-min access + 7-day refresh tokens. All API inputs validated with Zod. Mobile-first: 44px touch targets, bottom nav, card-based layouts.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `frontend/` | New | TanStack Start app, routes, Tailwind, layout components |
| `backend/` | New | Express API, Prisma, auth middleware, error handling |
| `backend/src/prisma/schema.prisma` | New | Full data model (6 entities, 4 enums) |
| `frontend/app/routes/` | New | File-based routing: login, `_authenticated` layout, dashboard |
| `frontend/app/components/layout/` | New | AppShell, BottomNav, TopBar |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| TanStack Start RC breaking changes | Low | Pin exact versions; avoid unreleased features |
| PostgreSQL VPS connection latency/failures | Med | Connection pooling, SSL, env-based config |
| Negative stock edge cases | Low | DB-level transaction guards (future sprints) |

## Rollback Plan

Delete created directories and drop database tables. No production data at risk.

## Dependencies

- PostgreSQL accessible on VPS with credentials
- Node.js >= 18 installed locally

## Success Criteria

- [ ] `frontend/` and `backend/` compile and start without errors
- [ ] Prisma migration runs, all 6 tables created in PostgreSQL
- [ ] Login flow works: email/password -> JWT -> protected dashboard
- [ ] Mobile viewport (320px+): touch targets >= 44px, bottom nav visible
- [ ] API responses < 200ms for auth endpoints
- [ ] Role-based redirect: unauthenticated users -> login page

## Sprint Breakdown (Full MVP Roadmap)

| Sprint | Scope | Separate SDD Change |
|--------|-------|---------------------|
| **0-1** (this) | Scaffolding + Auth | `gestorstock-mvp-sprint-0-1` |
| 2 | Categories + Products CRUD | `gestorstock-mvp-sprint-2` |
| 3 | Stock Movements + Dashboard | `gestorstock-mvp-sprint-3` |
| 4 | Suppliers + Work Orders | `gestorstock-mvp-sprint-4` |
| 5 | Mobile polish + Offline MVP | `gestorstock-mvp-sprint-5` |
