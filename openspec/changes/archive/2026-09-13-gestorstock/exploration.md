# Exploration: GestorStock — Workshop Stock Control System

## Current State

This is a **new project** with no existing codebase. The goal is to build a mobile-first web application for controlling stock in a mechanical workshop. The system must track parts, tools, consumables, and their movements (entries, exits, adjustments) while remaining usable primarily on mobile devices (tablets and phones) in a workshop environment.

## Domain Analysis

### What a Workshop Needs

A mechanical workshop stock system differs from a retail inventory system in several ways:

1. **Parts vs. Consumables**: Some items are reusable (tools), others are consumed per job (oil, filters, gaskets)
2. **Work Order Linking**: Stock exits should ideally link to a work order or vehicle/job
3. **Minimum Stock Alerts**: Critical for avoiding production stoppages
4. **Supplier Tracking**: Who supplied what, at what price, with what lead time
5. **Location Awareness**: Where in the workshop is this item stored (shelf, bin, drawer)
6. **Barcode/QR Code Support**: Quick scanning for lookup and stock movements
7. **Offline Usage**: Workshop may have poor WiFi in some areas

### Key Entities

```
User
├── id (PK)
├── email
├── name
├── role: ADMIN | MANAGER | MECHANIC
├── passwordHash
├── createdAt
├── updatedAt

Category
├── id (PK)
├── name
├── description
├── parentId (FK → Category, self-referencing for hierarchy)
├── createdAt

Product
├── id (PK)
├── sku (unique, barcode-friendly)
├── name
├── description
├── categoryId (FK → Category)
├── unitOfMeasure: UNIT | LITER | KILO | METER | BOX
├── minStockLevel (alert threshold)
├── currentStock (computed or cached)
├── location (free text: "Estante A - Cajon 3")
├── supplierId (FK → Supplier, nullable)
├── costPrice (last known cost)
├── salePrice (if sold separately)
├── isActive
├── createdAt
├── updatedAt

StockMovement
├── id (PK)
├── productId (FK → Product)
├── type: ENTRY | EXIT | ADJUSTMENT | RETURN
├── quantity (positive number, sign determined by type)
├── reason (free text: "Orden de trabajo #123", "Inventario inicial", "Devolucion")
├── workOrderId (FK → WorkOrder, nullable)
├── userId (FK → User, who performed the movement)
├── createdAt

Supplier
├── id (PK)
├── name
├── contactName
├── phone
├── email
├── address
├── taxId (CUIT/RUT/etc)
├── isActive
├── createdAt

WorkOrder
├── id (PK)
├── code (human-readable, e.g., "OT-2026-0001")
├── description
├── status: PENDING | IN_PROGRESS | COMPLETED | CANCELLED
├── customerName
├── customerPhone
├── vehicleInfo (JSON or structured: brand, model, plate)
├── createdAt
├── completedAt
├── userId (FK → User, assigned mechanic)
```

### Entity Relationships

```
Category 1--* Product
Category 1--* Category (self, parent/children)
Supplier 1--* Product
Product 1--* StockMovement
User 1--* StockMovement
WorkOrder 1--* StockMovement
User 1--* WorkOrder
```

### Data Model Considerations

- **Stock as events, not state**: The canonical stock level is the sum of all StockMovement quantities. The `currentStock` on Product is a denormalized cache for performance.
- **Soft deletes**: Products and Suppliers use `isActive` instead of hard deletes to preserve historical movements.
- **Immutable movements**: StockMovement records should never be edited; corrections are new ADJUSTMENT movements.
- **Self-referencing categories**: Allow hierarchies like "Filters" → "Oil Filters" → "Toyota Oil Filters".

## Architecture Proposal

### Frontend (React-Vite + TanStack)

```
frontend/
├── app/
│   ├── routes/
│   │   ├── __root.tsx              # Root layout with auth context
│   │   ├── index.tsx               # Dashboard / home
│   │   ├── login.tsx               # Login page
│   │   ├── _authenticated.tsx      # Pathless layout: auth guard
│   │   ├── _authenticated/
│   │   │   ├── dashboard.tsx       # Main dashboard
│   │   │   ├── products/
│   │   │   │   ├── index.tsx       # Product list
│   │   │   │   ├── new.tsx         # Create product
│   │   │   │   └── $productId.tsx  # Product detail
│   │   │   ├── categories/
│   │   │   │   ├── index.tsx
│   │   │   │   └── new.tsx
│   │   │   ├── stock-movements/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── entry.tsx
│   │   │   │   └── exit.tsx
│   │   │   ├── suppliers/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── new.tsx
│   │   │   │   └── $supplierId.tsx
│   │   │   ├── work-orders/
│   │   │   │   ├── index.tsx
│   │   │   │   ├── new.tsx
│   │   │   │   └── $workOrderId.tsx
│   │   │   ├── reports/
│   │   │   │   └── index.tsx
│   │   │   └── settings/
│   │   │       └── index.tsx
│   │   └── api/                    # API routes (if using TanStack Start)
│   ├── components/
│   │   ├── ui/                     # Reusable UI primitives (Button, Input, Card)
│   │   ├── layout/                 # AppShell, BottomNav, TopBar
│   │   ├── products/               # ProductCard, ProductForm, StockBadge
│   │   ├── stock/                  # MovementForm, MovementList
│   │   └── scan/                   # BarcodeScanner (camera-based)
│   ├── hooks/
│   │   ├── use-auth.ts
│   │   ├── use-products.ts
│   │   └── use-stock.ts
│   ├── lib/
│   │   ├── query-client.ts         # TanStack Query client config
│   │   ├── api.ts                  # API client/fetch wrappers
│   │   └── utils.ts                # cn(), formatting helpers
│   ├── types/
│   │   └── index.ts                # Shared TypeScript types
│   ├── styles/
│   │   └── globals.css             # Tailwind directives + custom vars
│   ├── client.tsx                  # Client entry
│   ├── router.tsx                  # Router setup
│   └── ssr.tsx                     # SSR entry (TanStack Start)
├── app.config.ts                   # TanStack Start config
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Backend (Node.js + Express + Prisma)

```
backend/
├── src/
│   ├── config/
│   │   ├── database.ts             # Prisma client singleton
│   │   ├── env.ts                  # Environment validation (zod)
│   │   └── cors.ts                 # CORS config
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── product.controller.ts
│   │   ├── category.controller.ts
│   │   ├── stock-movement.controller.ts
│   │   ├── supplier.controller.ts
│   │   ├── work-order.controller.ts
│   │   └── report.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── product.service.ts
│   │   ├── stock-movement.service.ts
│   │   └── report.service.ts
│   ├── repositories/
│   │   ├── product.repository.ts
│   │   ├── stock-movement.repository.ts
│   │   └── ...
│   ├── middleware/
│   │   ├── auth.middleware.ts      # JWT verification
│   │   ├── validate.middleware.ts  # Zod request validation
│   │   ├── error.middleware.ts     # Global error handler
│   │   └── rate-limit.middleware.ts
│   ├── routes/
│   │   ├── index.ts                # Route aggregator
│   │   ├── auth.routes.ts
│   │   ├── product.routes.ts
│   │   ├── stock-movement.routes.ts
│   │   └── ...
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── product.types.ts
│   │   └── api.types.ts
│   ├── utils/
│   │   ├── errors.ts               # AppError hierarchy
│   │   ├── password.ts             # bcrypt helpers
│   │   └── jwt.ts                  # Token generation
│   ├── prisma/
│   │   ├── schema.prisma           # Prisma schema
│   │   └── migrations/             # Migration files
│   └── app.ts                      # Express app setup
│   └── server.ts                   # Entry point
├── tests/
│   ├── unit/
│   ├── integration/
│   └── setup.ts
├── .env.example
├── .env
├── tsconfig.json
├── package.json
└── Dockerfile
```

### Prisma Schema (Draft)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String
  role          Role     @default(MECHANIC)
  passwordHash  String
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  movements     StockMovement[]
  workOrders    WorkOrder[]
}

enum Role {
  ADMIN
  MANAGER
  MECHANIC
}

model Category {
  id          String   @id @default(uuid())
  name        String
  description String?
  parentId    String?
  parent      Category? @relation("CategoryHierarchy", fields: [parentId], references: [id])
  children    Category[] @relation("CategoryHierarchy")
  products    Product[]
  createdAt   DateTime @default(now())
}

model Supplier {
  id          String   @id @default(uuid())
  name        String
  contactName String?
  phone       String?
  email       String?
  address     String?
  taxId       String?
  isActive    Boolean  @default(true)
  products    Product[]
  createdAt   DateTime @default(now())
}

model Product {
  id            String   @id @default(uuid())
  sku           String   @unique
  name          String
  description   String?
  categoryId    String?
  category      Category? @relation(fields: [categoryId], references: [id])
  unitOfMeasure UnitOfMeasure @default(UNIT)
  minStockLevel Int      @default(0)
  location      String?
  supplierId    String?
  supplier      Supplier? @relation(fields: [supplierId], references: [id])
  costPrice     Decimal? @db.Decimal(10, 2)
  salePrice     Decimal? @db.Decimal(10, 2)
  isActive      Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  movements     StockMovement[]
}

enum UnitOfMeasure {
  UNIT
  LITER
  KILO
  METER
  BOX
}

model StockMovement {
  id            String   @id @default(uuid())
  productId     String
  product       Product  @relation(fields: [productId], references: [id])
  type          MovementType
  quantity      Int      // Always positive; sign determined by type
  reason        String?
  workOrderId   String?
  workOrder     WorkOrder? @relation(fields: [workOrderId], references: [id])
  userId        String
  user          User     @relation(fields: [userId], references: [id])
  createdAt     DateTime @default(now())
}

enum MovementType {
  ENTRY
  EXIT
  ADJUSTMENT
  RETURN
}

model WorkOrder {
  id            String   @id @default(uuid())
  code          String   @unique
  description   String?
  status        WorkOrderStatus @default(PENDING)
  customerName  String?
  customerPhone String?
  vehicleBrand  String?
  vehicleModel  String?
  vehiclePlate  String?
  createdAt     DateTime @default(now())
  completedAt   DateTime?
  userId        String?
  user          User?    @relation(fields: [userId], references: [id])

  movements     StockMovement[]
}

enum WorkOrderStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  CANCELLED
}
```

## Functional Requirements

### MVP (Phase 1)

1. **Authentication**
   - Login with email/password
   - JWT-based session
   - Role-based access (ADMIN, MANAGER, MECHANIC)

2. **Product Management**
   - CRUD products with SKU, name, description
   - Assign category and supplier
   - Set minimum stock level
   - View current stock (computed from movements)
   - Soft delete (deactivate)

3. **Category Management**
   - CRUD categories
   - Hierarchical categories (parent/child)

4. **Stock Movements**
   - Register entry (purchase, return, adjustment)
   - Register exit (consumption, sale, adjustment)
   - Link exit to work order (optional)
   - View movement history per product
   - Stock level recalculation on every movement

5. **Supplier Management**
   - CRUD suppliers
   - View supplier's products

6. **Dashboard**
   - Low stock alerts (products below minStockLevel)
   - Recent movements
   - Total products count
   - Quick search

7. **Work Orders (Basic)**
   - Create work orders with customer/vehicle info
   - Link stock exits to work orders
   - View work order consumption

### Phase 2 (Post-MVP)

8. **Reports**
   - Stock valuation report
   - Movement history report (filter by date, product, user)
   - Work order consumption report
   - Supplier purchase history

9. **Barcode/QR Scanning**
   - Generate QR codes for products
   - Camera-based scanning for quick lookup
   - Scan to register stock movement

10. **Offline Support**
    - Queue movements when offline
    - Sync when connection restored
    - Cache product list for lookup

11. **Advanced Work Orders**
    - Work order status workflow
    - Assign mechanics
    - Time tracking
    - Invoice generation

12. **Multi-workshop**
    - Support multiple workshop locations
    - Transfer stock between locations

## Non-Functional Requirements

### Performance

- **Page load**: First meaningful paint < 2s on 3G
- **API response**: 95th percentile < 200ms for simple queries
- **List queries**: Pagination at 50 items per page
- **Database**: Index on `sku`, `productId` in movements, `createdAt` for time-based queries

### Security

- **Passwords**: bcrypt with salt rounds ≥ 12
- **JWT**: Short-lived access tokens (15 min), refresh tokens (7 days)
- **CORS**: Whitelist only known origins
- **Input validation**: Zod on all API inputs
- **SQL injection**: Prisma ORM prevents this by default
- **Rate limiting**: 100 req/min general, 5 req/min auth endpoints

### Reliability

- **Data integrity**: Stock movements use database transactions
- **Error handling**: Structured error responses, no stack traces in production
- **Graceful degradation**: If stock calculation fails, show cached value with warning

### Scalability

- **Stateless API**: Any request can be served by any backend instance
- **Connection pooling**: Prisma/PostgreSQL pool with max 20 connections
- **Image assets**: If product photos are added later, use object storage (S3/minio)

### Accessibility

- **Touch targets**: Minimum 44x44px for all interactive elements
- **Color contrast**: WCAG AA compliance
- **Screen reader**: Semantic HTML, ARIA labels on icon-only buttons
- **Keyboard**: All flows accessible via keyboard

## Mobile-First Considerations

### Design Decisions

1. **Bottom Navigation**: Primary navigation at the bottom (thumb-reachable)
2. **Floating Action Button (FAB)**: Quick-action button for "Add Movement" or "Scan"
3. **Card-based Lists**: Products and movements displayed as cards, not tables
4. **Swipe Actions**: Swipe on product card to quick-add exit movement
5. **Large Inputs**: Form inputs with adequate padding for touch
6. **Number Keypads**: Use `inputmode="numeric"` for quantity fields
7. **Modals over Pages**: Quick actions (add movement) as bottom-sheet modals, not full pages
8. **Pull-to-refresh**: Standard gesture for refreshing lists
9. **Infinite Scroll**: Instead of pagination controls, use intersection observer

### Responsive Breakpoints

- **Base**: Mobile portrait (320px+)
- **sm**: 640px — tablets in portrait, minor layout adjustments
- **md**: 768px — tablets in landscape, side nav possible
- **lg**: 1024px — desktop, full table views allowed

### Offline Strategy

- **Service Worker**: Cache static assets, app shell
- **IndexedDB**: Cache product list and recent movements
- **Background Sync**: Queue stock movements when offline, sync when online
- **Network-first with cache fallback**: For API reads

## Tech Stack Integration

### Frontend Stack

- **TanStack Start**: Full-stack framework, server functions for data fetching
- **TanStack Router**: File-based routing, type-safe navigation, loaders for data
- **TanStack Query**: Server state management, caching, optimistic updates for movements
- **React 19**: No manual useMemo/useCallback, use Server Components where possible
- **Tailwind CSS 4**: Utility-first styling, `cn()` for conditional classes, no `var()` in className
- **TypeScript**: Strict mode, const types pattern, flat interfaces, no `any`

### Backend Stack

- **Express.js**: Minimalist, well-known, large ecosystem
- **Prisma**: Type-safe ORM, migrations, schema as single source of truth
- **Zod**: Runtime validation for all API inputs
- **JWT**: jsonwebtoken for auth
- **bcrypt**: Password hashing
- **Helmet + CORS**: Security headers

## Risks

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Workshop poor connectivity | High | High | Implement offline-first with background sync |
| Barcode scanning unreliable on mobile | Medium | Medium | Fallback to manual SKU input; test camera scanning early |
| Complex stock calculations (negative stock?) | High | Low | Enforce non-negative stock in DB transactions; allow negative only for ADJUSTMENT with admin role |
| User adoption (mechanics not tech-savvy) | High | Medium | Keep UI simple, minimize clicks, provide training mode |
| VPS PostgreSQL latency | Medium | Medium | Connection pooling, query optimization, consider read replicas if scale grows |
| TanStack Start RC stability | Medium | Low | Monitor for breaking changes; have fallback to pure Vite + React if needed |
| Mobile browser compatibility | Medium | Low | Test on actual devices (Android Chrome, iOS Safari) |

## Open Questions

1. **Multi-location?** Is this for one workshop or multiple? (Assumes single for MVP)
2. **Currency?** What currency for cost/sale prices? (Assumes local currency, no multi-currency)
3. **Barcode hardware?** Will they use phone camera or dedicated barcode scanners? (Assumes phone camera)
4. **Work order detail?** Is time tracking, labor cost, or invoicing needed? (Out of scope for MVP)
5. **Backup?** Who manages DB backups on the VPS? (Assumes user handles this)
6. **Notifications?** Email/push alerts for low stock? (Email for MVP, push later)

## Recommendation

**Ready for Proposal**: Yes.

The domain is well-understood, the stack is solid, and the MVP scope is clear. The next step should be `sdd-propose` to create a formal change proposal for the initial project setup and MVP implementation.

### Suggested MVP Sprint Plan

1. **Sprint 0**: Project scaffolding (TanStack Start + Express + Prisma + PostgreSQL)
2. **Sprint 1**: Authentication + User management
3. **Sprint 2**: Categories + Products + Stock CRUD
4. **Sprint 3**: Stock Movements + Dashboard
5. **Sprint 4**: Suppliers + Work Orders (basic)
6. **Sprint 5**: Mobile polish + Offline MVP

Each sprint should be a separate SDD change to keep review focused and delivery safe.
