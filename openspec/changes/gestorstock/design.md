# Design: GestorStock MVP Sprint 0-1

## Technical Approach

Greenfield monorepo with `frontend/` (TanStack Start as SPA + TanStack Router/Query) and `backend/` (Express + Prisma). The frontend communicates with the backend via REST API — **NOT** using TanStack Start server functions (`createServerFn`). This keeps the API boundary explicit, avoids RC middleware instability, and maintains clean separation of concerns. JWT auth with 15-min access tokens (in-memory) and 7-day refresh tokens (httpOnly cookie). Mobile-first layout with `_authenticated` pathless route guard.

## Architecture Decisions

### Decision: Monorepo with npm Workspaces

| Option | Tradeoff | Decision |
|--------|----------|----------|
| npm workspaces | Simple, no extra tooling; shared devdeps; less strict than pnpm | ✅ Chosen |
| pnpm workspaces | Strict, fast installs; added complexity; HoF issues with Prisma | ❌ Overkill for 2-package monorepo |
| Turborepo | Great caching; hefty setup for 2 packages | ❌ Premature optimization |

**Rationale**: Two packages don't justify Turborepo. npm workspaces give us `npm run dev -ws` for concurrent dev without extra tooling. Prisma works cleanly with npm workspaces.

### Decision: No TanStack Start Server Functions

| Option | Tradeoff | Decision |
|--------|----------|----------|
| `createServerFn` for API | Type-safe RPC; couples frontend to framework | ❌ RC risk |
| REST API to Express backend | Explicit API contract; framework-agnostic; simpler mental model | ✅ Chosen |

**Rationale**: The specs define a separate Express backend with Prisma. Using `createServerFn` would mean routing some API logic through TanStack Start's Nitro server and some through Express — incoherent. TanStack Start is used purely as SPA bundler (Vite + file-based routing). All data mutations go through `fetch()` to Express.

### Decision: Refresh Token Storage — Database Table

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Redis set | Fast lookup; expiry built-in; extra infra dependency | ❌ MVP avoids Redis |
| In-memory map | Simple; lost on restart; no scale | ❌ Production-unready |
| DB table `RefreshToken` | Durable; no extra infra; slightly slower lookup | ✅ Chosen |

**Rationale**: For MVP on a VPS, adding Redis is unnecessary infra. A `RefreshToken` table with `(id, userId, tokenHash, expiresAt, revokedAt, createdAt)` supports rotation and replay detection. Token lookup is ~1ms on indexed column — acceptable for refresh frequency.

### Decision: JWT HS256 for Both Tokens

| Option | Tradeoff | Decision |
|--------|----------|----------|
| RS256 for refresh | Key rotation without secret rotation; heavier verify | ❌ Complexity for MVP |
| HS256 for both | Simple; single secret pair; sufficient for MVP scale | ✅ Chosen |

**Rationale**: RS256 adds key management complexity. For a workshop internal tool, HS256 with `JWT_SECRET` (access) and `JWT_REFRESH_SECRET` (refresh) is sufficient. Can migrate to RS256 if scaling to public API.

### Decision: Access Token in Memory, Refresh Token in httpOnly Cookie

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Both in localStorage | Simple; XSS-vulnerable | ❌ Security risk |
| Access in memory + refresh in httpOnly cookie | No XSS for refresh; access cleared on tab close; refresh survives | ✅ Chosen |
| Both in httpOnly cookie | CSRF risk on refresh endpoint | ❌ Avoidable complexity |

**Rationale**: In-memory access tokens are invisible to XSS (most critical) and cleared on tab close. The httpOnly, Secure, SameSite=Strict cookie for refresh tokens prevents JS access. The refresh endpoint uses POST only (mitigates CSRF).

### Decision: Zod Schemas Duplicated Per Package (MVP)

| Option | Tradeoff | Decision |
|--------|----------|----------|
| Shared `@gestorstock/types` package | DRY; trivial for 2 packages | Defer to Sprint 2 |
| Duplicated in frontend/ and backend/ | Some drift risk; zero infra complexity | ✅ Chosen for Sprint 0-1 |

**Rationale**: For 3 auth endpoints, duplication is minimal (login schema, refresh schema, user response). Creating a shared package now adds workspace config complexity we don't need yet. Sprint 2 (CRUD) will extract shared types when schemas multiply.

## Data Flow

```
┌──────────────────────────────────────────────────────────┐
│  Frontend (TanStack Start SPA)                           │
│                                                          │
│  ┌──────────┐   ┌───────────────┐   ┌────────────────┐  │
│  │ Login    │──▶│ AuthContext    │──▶│ QueryClient     │  │
│  │ Page     │   │ (tokens+user)  │   │ (cache+mutate)  │  │
│  └──────────┘   └───────┬───────┘   └───────┬────────┘  │
│                         │                    │           │
│  ┌──────────┐   ┌──────┴───────┐   ┌───────┴────────┐  │
│  │ TopBar   │   │ _authenticated│   │ API fetch()    │  │
│  │ BottomNav│   │ beforeLoad    │   │ (Bearer token)  │  │
│  └──────────┘   └──────────────┘   └───────┬────────┘  │
│                                            │            │
└────────────────────────────────────────────┼────────────┘
                                             │ HTTP POST
                          ┌──────────────────┼─────────────────┐
                          │  Backend (Express + Prisma)        │
                          │                                     │
                          │  ┌────────┐  ┌─────────┐  ┌────┐  │
                          │  │ Routes │─▶│ Services │─▶│Pris│  │
                          │  │ /api/*  │  │ (auth,   │  │ ma │  │
                          │  │         │  │  health) │  │  .db│  │
                          │  └───┬────┘  └─────────┘  └──┬─┘  │
                          │      │                        │     │
                          │  ┌───┴────┐            ┌────┴──┐  │
                          │  │ Zod    │            │PostgreSQL│ │
                          │  │ valid  │            │  (VPS)  │ │
                          │  └────────┘            └─────────┘  │
                          └─────────────────────────────────────┘
```

### Auth Flow

```
Login ──POST /api/auth/login──▶ Express
   ◀── { accessToken, user } + Set-Cookie: refreshToken
   │
   │ (store accessToken in memory, user in AuthContext)
   │
API call ──Authorization: Bearer <accessToken>──▶ Auth Middleware
   │                                              │
   │                                         401? │
   │                                              ▼
   │           ┌────POST /api/auth/refresh───── Express
   │           │     (httpOnly cookie sent)       │
   │           │  ◀── { accessToken } +           │
   │           │      Set-Cookie: new refreshToken│
   │           │                                  │
   │           │  (rotate: revoke old, issue new) │
   │           └──▶ Retry original request ──────┘
   │
   │  Refresh also 401?
   └──▶ Clear tokens, redirect to /login
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `package.json` | Create | Root workspace package.json with workspaces config |
| `frontend/package.json` | Create | TanStack Start + React + TanStack Query/Router deps |
| `frontend/tsconfig.json` | Create | Strict TypeScript config for frontend |
| `frontend/vite.config.ts` | Create | Vite config with TanStack Router plugin + proxy |
| `frontend/app.config.ts` | Create | TanStack Start app config |
| `frontend/app/router.tsx` | Create | Router creation with auth context |
| `frontend/app/client.tsx` | Create | Client entry point |
| `frontend/app/ssr.tsx` | Create | SSR entry (TanStack Start requirement) |
| `frontend/app/routes/__root.tsx` | Create | Root layout: QueryClient, AuthProvider, ErrorBoundary |
| `frontend/app/routes/login.tsx` | Create | Login page with form validation |
| `frontend/app/routes/_authenticated.tsx` | Create | Pathless auth layout: TopBar + content + BottomNav |
| `frontend/app/routes/_authenticated/dashboard.tsx` | Create | Dashboard placeholder page |
| `frontend/app/routes/$.tsx` | Create | 404 catch-all route |
| `frontend/app/lib/auth-context.tsx` | Create | AuthProvider, useAuth hook, token management |
| `frontend/app/lib/api-client.ts` | Create | Fetch wrapper with auto-refresh interceptor |
| `frontend/app/lib/query-client.ts` | Create | TanStack Query client config |
| `frontend/app/components/layout/top-bar.tsx` | Create | Fixed top bar with title + user avatar |
| `frontend/app/components/layout/bottom-nav.tsx` | Create | Fixed bottom nav with 4 items |
| `frontend/app/components/ui/button.tsx` | Create | Base button component (44px min) |
| `frontend/app/components/ui/input.tsx` | Create | Base input component (44px min height) |
| `frontend/app/lib/cn.ts` | Create | cn() utility (clsx + tailwind-merge) |
| `frontend/app/styles/app.css` | Create | Tailwind 4 import + semantic theme tokens |
| `backend/package.json` | Create | Express + Prisma + Zod + bcrypt + jsonwebtoken deps |
| `backend/tsconfig.json` | Create | Strict TypeScript config for backend |
| `backend/src/index.ts` | Create | Express app entry: middleware stack, routes, error handler |
| `backend/src/config/env.ts` | Create | Zod env validation schema |
| `backend/src/config/database.ts` | Create | Prisma client singleton |
| `backend/src/middleware/auth.ts` | Create | JWT auth middleware (verify + attach user) |
| `backend/src/middleware/role.ts` | Create | Role-based access middleware |
| `backend/src/middleware/validate.ts` | Create | Zod validation middleware |
| `backend/src/middleware/rate-limit.ts` | Create | Rate limiting (100/min general, 5/min auth) |
| `backend/src/routes/auth.ts` | Create | Auth routes: login, refresh, logout, me |
| `backend/src/routes/health.ts` | Create | Health check route |
| `backend/src/services/auth.service.ts` | Create | Auth business logic: login, refresh, revoke |
| `backend/src/services/user.service.ts` | Create | User lookup and creation |
| `backend/src/schemas/auth.schema.ts` | Create | Zod schemas for auth request/response |
| `backend/src/utils/errors.ts` | Create | Custom error classes (AppError, ValidationError, etc.) |
| `backend/src/utils/response.ts` | Create | Structured response helper |
| `backend/prisma/schema.prisma` | Create | Full Prisma schema (6 entities, 4 enums) |
| `backend/prisma/seed.ts` | Create | Seed admin user script |
| `backend/prisma/migrations/` | Create | Initial migration directory |

## Interfaces / Contracts

### API Endpoints

```
POST /api/auth/login
  Body: { email: string, password: string }
  Response 200: { accessToken: string, user: { id, name, email, role } }
  Set-Cookie: refreshToken (httpOnly, Secure, SameSite=Strict, Path=/api/auth, 7d)
  Errors: 400 (validation), 401 (invalid credentials)

POST /api/auth/refresh
  Cookie: refreshToken
  Response 200: { accessToken: string, user: { id, name, email, role } }
  Set-Cookie: refreshToken (rotated, same attributes)
  Errors: 401 (expired/invalid/revoked)

POST /api/auth/logout
  Cookie: refreshToken
  Response 204
  (Idempotent — succeeds even if token already revoked)

GET /api/auth/me
  Authorization: Bearer <accessToken>
  Response 200: { id, name, email, role, isActive }
  Errors: 401

GET /api/health
  Response 200: { status: "ok", timestamp: string, database: "connected" }
  Response 503: { status: "degraded", timestamp: string, database: "disconnected" }
```

### TypeScript Interfaces (Backend)

```typescript
// Decoded JWT payload
interface JwtPayload {
  sub: string;   // user ID
  email: string;
  role: UserRole;
  exp: number;
  iat: number;
}

// Auth response shape
interface AuthResponse {
  accessToken: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  };
}

// Error response shape
interface ApiError {
  status: "error";
  message: string;
  details?: Array<{ field: string; message: string }>;
}
```

### Zod Schemas (Backend)

```typescript
// loginSchema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// refreshTokenSchema (cookie validation)
const refreshTokenSchema = z.string().min(1);

// createUserSchema (admin-only)
const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "MANAGER", "MECHANIC"]),
});
```

### Frontend Auth Context Shape

```typescript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
}
```

### Prisma Schema Key Decisions

- **UUID primary keys**: All entities use `@id @default(uuid())`
- **Timestamps**: All entities have `createdAt DateTime @default(now())` and `updatedAt DateTime @updatedAt`
- **Cascade rules**: Product→Category: restrict delete; StockMovement→Product: cascade; WorkOrder→Product: restrict
- **Indexes**: Unique on User.email, unique on Product.sku, composite on StockMovement(productId, createdAt), composite on WorkOrder(status, assignedToId)

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | Auth service (login, refresh, token rotation) | vitest + mocks for Prisma |
| Unit | Zod schema validation (login, createUser) | vitest, direct schema.parse() |
| Unit | Env validation (missing/invalid vars) | vitest, process.env manipulation |
| Integration | Auth API endpoints (login, refresh, logout, me) | supertest + test DB |
| Integration | Health check with DB up/down | supertest |
| Integration | Rate limiting on auth endpoints | supertest + timing |
| Component | Login form (validation, loading, error states) | @testing-library/react + vitest |
| Component | BottomNav (active state, navigation) | @testing-library/react |
| Component | TopBar (render with/without user) | @testing-library/react |
| Component | AuthProvider (token refresh, redirect) | @testing-library/react |

- **E2E**: Deferred to Sprint 2 (Playwright)
- **Coverage target**: 70% backend services, 50% frontend components
- **Strict TDD**: OFF (per config). Tests written after implementation for Sprint 0-1, TDD enabled later.

## Migration / Rollout

**No migration required** — this is a greenfield project. Initial deployment steps:

1. Run `npx prisma migrate deploy` on VPS PostgreSQL
2. Run `npx prisma db seed` to create admin user
3. Deploy backend with environment variables set in VPS env
4. Build frontend with `VITE_API_URL` pointing to backend
5. Serve frontend as static files (or separate host)

**Rollback**: Drop all tables, delete deployed directories. No production data at risk.

## Open Questions

- [ ] **Admin user password**: Seed creates admin — should the password be env-configured (`ADMIN_SEED_PASSWORD`) or hardcoded for MVP? (Recommendation: env-configured)
- [ ] **CORS_ORIGIN in production**: Will it be a single domain or multiple? (Recommendation: single domain for MVP)
- [ ] **Frontend hosting**: Serve from Express static, or separate? (Recommendation: separate — simpler deploys, CDN later)