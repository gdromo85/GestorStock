# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Owner/manager of Argojardín**: manages stock, registers movements, checks workshop state, creates work orders.
- **Workshop mechanics**: consult products, spare parts (repuestos), and assigned work orders during the day.

Both roles use the system equally, several times a day, from a phone (mobile-first, 44px touch targets, safe-area insets already established).

## Product Purpose

GestorStock is the internal stock-control webapp for **Argojardín**, a motoimplemento business (service, sales, and spare parts). It tracks products, spare parts, stock movements, suppliers, and work orders for the workshop. Success: any staff member can check or update stock in seconds between workshop tasks, without errors or guesswork.

## Positioning

Purpose-built for the motoimplemento trade: parts and machines tracked the way a STIHL/ECHO service shop actually works (work orders, machine parts, consumables), not a generic inventory template.

## Operating Context

- **Business**: Argojardín (est. 2015) — repair and sales of motoimplementos, sales of insumos and repuestos.
- **Product brands handled**: STIHL, ECHO, FEMA, Briggs & Stratton, Gamma.
- **Services advertised**: Service · Ventas · Repuestos — motoguadañas, cortadoras de césped, motosierras, generadores.
- **Contact**: WhatsApp 3513673578 / 3513535421 (Córdoba, Argentina).
- Usage happens in the workshop environment: hands busy, interruptions frequent, phone in hand.

## Capabilities and Constraints

- Auth (JWT access + rotating refresh), roles: ADMIN and mechanic users.
- Entities: User, Category, Product, StockMovement, Supplier, WorkOrder.
- Mobile-first PWA-style webapp; Spanish (Argentina) UI language for end users.
- Stack: React + TanStack Start/Router/Query, Tailwind 4, Express 5, Prisma 7, PostgreSQL.
- Open: whether mechanics get limited read-only vs. write access (not yet decided).

## Brand Commitments

- **Name on the system**: GestorStock (the tool) for business Argojardín.
- **Logo**: `agrojardin/logo.bmp` — chainsaw isologo over an orange sun disc, "EST. 2015", wordmark in violet/magenta.
- **Colors from existing material**: dominant **orange** (banner accent + logo sun), **green** (banner field), violet/magenta wordmark, black.
- **Style direction (user-confirmed)**: modern / clean.
- Banner reference: `agrojardin/baner.bmp`.

## Evidence on Hand

- Logo and banner images at `agrojardin/logo.bmp`, `agrojardin/baner.bmp` (BMP; PNG conversions were made for analysis only).
- Facebook page referenced by the owner: https://www.facebook.com/agro.jardin.2025/ (not externally fetchable).
- No fabricated claims allowed: no testimonials, no pricing, no customer lists.

## Product Principles

1. **Speed between tasks**: every core action (find a part, register a movement) must be reachable in seconds on a phone.
2. **Trust the count**: stock numbers must always reflect reality; movements are traceable.
3. **Workshop-first language**: speak the trade (repuestos, motoimplementos, service), not generic inventory jargon.
4. **One-handed operation**: primary actions live in thumb reach (bottom nav already does this).

## Accessibility & Inclusion

- Touch targets ≥ 44px (already enforced in the incumbent UI).
- Readable in bright workshop/garage lighting conditions: strong contrast, no thin light-gray text on white.
