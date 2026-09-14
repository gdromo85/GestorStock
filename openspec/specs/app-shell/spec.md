# App Shell Specification

## Purpose

Define the mobile-first application shell: root layout, navigation components, responsive design system, and the authenticated route guard wrapper. This is the visual and structural foundation that all feature pages render within.

## Requirements

### Requirement: Root Layout

The application MUST have a root layout (`__root.tsx`) that provides the auth context, TanStack Query client, and a global error boundary. The root layout MUST render an `<Outlet />` for child routes.

#### Scenario: Root layout renders

- GIVEN the application starts
- WHEN the root route loads
- THEN the auth context provider wraps the entire app
- AND the QueryClientProvider is active
- AND the outlet renders the matched child route

#### Scenario: Global error boundary catches render errors

- GIVEN a child route component throws during render
- WHEN the error propagates to the root layout
- THEN the error boundary displays a fallback UI with a retry button
- AND the error is logged (not silently swallowed)

### Requirement: BottomNav Component

The BottomNav MUST be a fixed-bottom navigation bar visible on all authenticated pages. It MUST contain exactly 4 items: Dashboard, Products, Movements, Menu. Each item MUST have an icon and a label. The active item MUST be visually distinct.

#### Scenario: BottomNav renders on authenticated pages

- GIVEN the user is on any route under `_authenticated`
- WHEN the page renders
- THEN BottomNav is visible at the bottom of the viewport
- AND all 4 navigation items are displayed

#### Scenario: Active item indication

- GIVEN the user is on the Products page
- WHEN BottomNav renders
- THEN the Products item has an active visual state (different color/weight)
- AND the other items have an inactive state

#### Scenario: Navigation on tap

- GIVEN the user is on the Dashboard page
- WHEN the user taps the Products item in BottomNav
- THEN the app navigates to the Products route
- AND the Products item becomes active

#### Scenario: BottomNav hidden on login page

- GIVEN the user is on the `/login` page
- WHEN the page renders
- THEN BottomNav is NOT visible

### Requirement: TopBar Component

The TopBar MUST be a fixed-top bar showing the app title and user avatar/menu. It MUST be visible on all authenticated pages.

#### Scenario: TopBar renders on authenticated pages

- GIVEN the user is on any `_authenticated` route
- WHEN the page renders
- THEN TopBar is visible at the top of the viewport
- AND the app title "GestorStock" is displayed
- AND a user avatar or initials indicator is shown

#### Scenario: TopBar hidden on login page

- GIVEN the user is on the `/login` page
- WHEN the page renders
- THEN TopBar is NOT visible

### Requirement: Authenticated Layout

The `_authenticated` pathless route MUST compose the page structure: TopBar at top, scrollable content area in the middle, BottomNav at bottom. The content area MUST account for the fixed heights of TopBar and BottomNav (no content hidden behind them).

#### Scenario: Page structure

- GIVEN the user is on `/_authenticated/dashboard`
- WHEN the layout renders
- THEN TopBar occupies the top of the viewport
- AND BottomNav occupies the bottom of the viewport
- AND the dashboard content fills the space between them
- AND the content area is scrollable independently

#### Scenario: Content not obscured by fixed elements

- GIVEN the page has content that scrolls to the bottom
- WHEN the user scrolls to the very bottom
- THEN all content is visible above the BottomNav
- AND no content is hidden behind BottomNav or TopBar

### Requirement: Responsive Breakpoints

The layout MUST support 4 breakpoints: base (320px), sm (640px), md (768px), lg (1024px). The design MUST be mobile-first — base styles target 320px, with progressive enhancement at wider breakpoints.

#### Scenario: Mobile viewport (320px)

- GIVEN the viewport width is 320px
- WHEN the app shell renders
- THEN BottomNav shows all 4 items without horizontal overflow
- AND TopBar shows title and avatar without truncation
- AND content uses full available width minus padding

#### Scenario: Tablet viewport (768px)

- GIVEN the viewport width is 768px
- WHEN the app shell renders
- THEN the layout adapts (wider content area, adjusted spacing)
- AND all navigation items remain accessible

#### Scenario: Desktop viewport (1024px)

- GIVEN the viewport width is 1024px
- WHEN the app shell renders
- THEN the content area is centered or max-width constrained
- AND the layout does not break or overflow

### Requirement: Touch Target Sizing

All interactive elements (buttons, nav items, links, inputs) MUST have a minimum touch target of 44x44 CSS pixels, per WCAG 2.5.8.

#### Scenario: BottomNav items meet touch target

- GIVEN BottomNav is rendered
- WHEN each nav item's bounding box is measured
- THEN each item is at least 44px tall and 44px wide

#### Scenario: Form inputs meet touch target

- GIVEN the login form is rendered
- WHEN input fields and the submit button are measured
- THEN each has a minimum height of 44px

#### Scenario: TopBar interactive elements

- GIVEN TopBar contains a menu/avatar button
- WHEN the button's bounding box is measured
- THEN it is at least 44x44 CSS pixels

### Requirement: Loading States

The app shell MUST provide loading indicators for route transitions. A pending component MUST be shown while route loaders are executing.

#### Scenario: Route transition loading

- GIVEN the user taps a BottomNav item
- WHEN the target route's loader is executing
- THEN a loading indicator is displayed (spinner or skeleton)
- AND the previous page content remains visible or is replaced by the loader

#### Scenario: Initial app load

- GIVEN the user opens the app
- WHEN the initial route is loading
- THEN a loading state is shown (not a blank screen)

### Requirement: Theme Setup

The app MUST use Tailwind CSS 4 with a semantic color theme. Light mode is the default for MVP. The `cn()` utility (clsx + tailwind-merge) MUST be available for conditional class composition.

#### Scenario: Tailwind classes apply correctly

- GIVEN the app is running in development
- WHEN a component uses `className="bg-primary text-white"`
- THEN the styles are applied using the semantic theme tokens

#### Scenario: cn() utility works

- GIVEN the cn utility is imported
- WHEN called with `cn("px-4", isActive && "bg-blue-500")`
- THEN the output string merges classes correctly
- AND conflicting classes are resolved by tailwind-merge

### Requirement: File-Based Routing Skeleton

The app MUST use TanStack Router file-based routing. The route tree MUST include: `__root.tsx`, `login.tsx`, `_authenticated.tsx` (pathless layout), `_authenticated/dashboard.tsx` (placeholder), and a catch-all `$.tsx` for 404.

#### Scenario: Route tree generates

- GIVEN the route files exist in `app/routes/`
- WHEN the Vite dev server starts
- THEN `routeTree.gen.ts` is auto-generated
- AND all routes are registered in the tree

#### Scenario: Unknown route shows 404

- GIVEN the user navigates to `/nonexistent-page`
- WHEN the router matches the URL
- THEN the catch-all route renders a 404 message
- AND a link back to the dashboard is provided

#### Scenario: Root path redirects

- GIVEN an authenticated user visits `/`
- WHEN the root route loads
- THEN the user is redirected to `/_authenticated/dashboard`
