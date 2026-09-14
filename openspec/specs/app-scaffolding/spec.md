# App Scaffolding Specification

## Purpose

Establish the monorepo foundation, build tooling, database schema, and environment configuration for GestorStock. This is the greenfield base that all subsequent sprints build upon.

## Requirements

### Requirement: Monorepo Structure

The project MUST be organized as a monorepo with `frontend/` (TanStack Start + Vite) and `backend/` (Express + Prisma) directories. Each directory MUST have its own `package.json`, `tsconfig.json`, and independent dependency management.

#### Scenario: Frontend compiles and starts

- GIVEN the monorepo is cloned and dependencies installed
- WHEN `npm run dev` is executed inside `frontend/`
- THEN the TanStack Start dev server starts without errors on the configured port
- AND the root route renders a valid HTML response

#### Scenario: Backend compiles and starts

- GIVEN the monorepo is cloned and dependencies installed
- WHEN `npm run dev` is executed inside `backend/`
- THEN the Express server starts without errors on the configured port
- AND the health check endpoint responds with status 200

#### Scenario: TypeScript strict mode enforced

- GIVEN either `frontend/` or `backend/` contains a TypeScript error
- WHEN the TypeScript compiler runs (`tsc --noEmit`)
- THEN the build fails with at least one error diagnostic

### Requirement: Environment Validation

The system MUST validate all required environment variables at startup using Zod schemas. Missing or invalid variables MUST cause the process to exit with a descriptive error message.

Required variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `PORT`, `NODE_ENV`, `CORS_ORIGIN`.

#### Scenario: Valid environment

- GIVEN all required environment variables are set with valid values
- WHEN the backend process starts
- THEN the server initializes normally and logs successful env validation

#### Scenario: Missing required variable

- GIVEN `DATABASE_URL` is not set in the environment
- WHEN the backend process starts
- THEN the process exits with code 1
- AND stderr contains a message identifying `DATABASE_URL` as missing

#### Scenario: Invalid variable format

- GIVEN `PORT` is set to a non-numeric string
- WHEN the backend process starts
- THEN the process exits with code 1
- AND stderr contains a validation error for `PORT`

### Requirement: Prisma Schema

The Prisma schema MUST define exactly 6 entities: `User`, `Category`, `Product`, `StockMovement`, `Supplier`, `WorkOrder`. All entities MUST use UUID primary keys. Timestamps (`createdAt`, `updatedAt`) MUST be present on all entities.

Entity relationships:
- `Product` belongs to `Category` (many-to-one)
- `StockMovement` references `Product` and `User` (author)
- `WorkOrder` references `Product`, `User` (assignedTo), and `Supplier`

Enums: `UserRole` (ADMIN, MANAGER, MECHANIC), `MovementType` (IN, OUT), `WorkOrderStatus` (PENDING, IN_PROGRESS, COMPLETED, CANCELLED), `ProductCondition` (NEW, USED, REFURBISHED).

#### Scenario: Migration creates all tables

- GIVEN a fresh PostgreSQL database and valid `DATABASE_URL`
- WHEN `npx prisma migrate deploy` runs
- THEN all 6 tables are created in the database
- AND all 4 enums are created
- AND all foreign key constraints are in place

#### Scenario: Seed creates admin user

- GIVEN the migration has completed successfully
- WHEN `npx prisma db seed` runs
- THEN at least one User record exists with role ADMIN

#### Scenario: Schema prevents orphaned records

- GIVEN a Product exists with a categoryId referencing Category X
- WHEN Category X is deleted
- THEN the operation MUST be blocked by the foreign key constraint (restrict) OR cascade as defined

### Requirement: Database Connection

The system MUST establish a connection pool to PostgreSQL at startup. The connection MUST support SSL. The pool MUST handle reconnection on transient failures.

#### Scenario: Successful connection

- GIVEN valid PostgreSQL credentials in `DATABASE_URL`
- WHEN the backend starts
- THEN a connection pool is established
- AND the health check endpoint reports database status as connected

#### Scenario: Connection failure

- GIVEN `DATABASE_URL` points to an unreachable host
- WHEN the backend starts
- THEN the process logs a connection error
- AND the health check endpoint reports database status as disconnected

### Requirement: Health Check Endpoint

The backend MUST expose `GET /api/health` that returns system status without authentication.

Response shape: `{ status: "ok" | "degraded", timestamp: string, database: "connected" | "disconnected" }`.

#### Scenario: Healthy system

- GIVEN the server and database are running
- WHEN `GET /api/health` is called
- THEN the response status is 200
- AND the body contains `status: "ok"` and `database: "connected"`

#### Scenario: Database disconnected

- GIVEN the server is running but the database is unreachable
- WHEN `GET /api/health` is called
- THEN the response status is 503
- AND the body contains `status: "degraded"` and `database: "disconnected"`

### Requirement: Express Security Middleware

The backend MUST apply `helmet`, CORS (restricted to `CORS_ORIGIN`), `compression`, and JSON body parsing (limit 10MB) to all routes.

#### Scenario: CORS blocks unauthorized origin

- GIVEN `CORS_ORIGIN` is set to `https://app.gestorstock.com`
- WHEN a request arrives from `https://evil.com`
- THEN the response includes no `Access-Control-Allow-Origin` header for that origin

#### Scenario: Request body exceeds limit

- GIVEN the JSON body limit is 10MB
- WHEN a request sends a 15MB JSON body
- THEN the server responds with status 413

### Requirement: Global Error Handler

The backend MUST catch all unhandled errors and return a structured JSON response. In production, internal error details MUST NOT be exposed.

#### Scenario: Known application error

- GIVEN a route throws a validation error
- WHEN the error reaches the global handler
- THEN the response status is 400
- AND the body contains `{ status: "error", message: "..." }`

#### Scenario: Unknown error in production

- GIVEN `NODE_ENV` is `production`
- WHEN an unhandled TypeError occurs
- THEN the response status is 500
- AND the body message is "Internal server error" (no stack trace)
