---
target: login surface (login.tsx + shell)
total_score: 18
max_score: 40
na_heuristics: 
p0_count: 1
p1_count: 2
target_identity: "file:D:\\GitHub\\GestorStock\\frontend\\app\\routes\\login.tsx"
target_fingerprint: "sha256:58965afb1ed45ad61ee3ccfcd76329cc8650f43b6b56d5f6bbbce07de51a7a26"
target_path: "D:\\GitHub\\GestorStock\\frontend\\app\\routes\\login.tsx"
timestamp: 2026-09-13T16-34-40Z
slug: frontend-app-routes-login-tsx
---
# Impeccable Design Critique — GestorStock Login Surface

Method: dual-agent (A: ses_f6469034 · B: ses_f6468cb9). Browser visualization skipped: no dev server running; CLI detector already returned clean, so the overlay would visualize the same zero findings.

## Design Health Score (Nielsen, 0-4)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | Spinner + role="alert" good; no indicator during session restore |
| 2 | Match System / Real World | 1 | All copy in English for a Spanish-speaking workshop |
| 3 | User Control and Freedom | 2 | Redirect preserved; zero escape routes when locked out |
| 4 | Consistency and Standards | 2 | lang="es" with English UI = self-contradiction |
| 5 | Error Prevention | 2 | Zod + autoComplete good; no password visibility toggle |
| 6 | Recognition Rather Than Recall | 3 | Labels associated, autoComplete correct — strongest area |
| 7 | Flexibility and Efficiency | 1 | Full email+password every time, used several times daily |
| 8 | Aesthetic and Minimalist Design | 2 | Clean by default, not by intent — no personality |
| 9 | Error Recovery | 2 | ARIA good; English error messages don't help |
| 10 | Help and Documentation | 1 | No forgot-password, no contact path |
| **Total** | | **18/40** | Poor — major UX overhaul required |

## Design Specificity Verdict

This login could belong to any SaaS product built in the last 5 years. Deep blue (hue 240), English copy, no logo, no orange, no green. The deterministic detector returned clean (0 findings across 10 files) — the code is disciplined with tokens, touch targets, and ARIA. But clean is not authored: the detector cannot see that the primary palette contradicts the brand or that the language mismatches the users. The token system is good enough that re-anchoring it to orange/green is cheap.

## Cognitive Load

0 failures (low). The login form is compositionally clean; problems are brand/language, not structure.

## Emotional Journey

Arrival peak: mechanic opens the PWA and sees a blue English card — "Is this right?" feeling at the worst possible moment. Index page adds an interstitial tap. Post-login end: empty dashboard placeholder. Cold arrival → effort → empty room.

## Strengths

1. Genuine accessibility scaffolding (aria-invalid, aria-describedby, role="alert", label association) — structural, not cosmetic.
2. autoComplete="email"/"current-password" — one-tap autofill on the mechanic's phone.
3. Proportionally correct card composition (max-w-sm, centered, 44px targets).

## Priority Issues

- [P0] All UI copy in English ("Sign In", "Email", "Password", errors, nav labels) for a Córdoba workshop. Fix: neutral Argentine Spanish throughout ("Iniciar sesión", "Correo electrónico", "Contraseña", "Panel/Productos/Movimientos/Menú"). Command: /impeccable clarify
- [P1] Primary palette hue-240 blue contradicts brand (orange dominant + green). Fix: primary derived from brand orange (~hue 30-40), green as accent/success, violet only for wordmark moments. Command: /impeccable colorize
- [P1] No logo or brand imagery anywhere (login, index, TopBar). Logo exists at agrojardin/logo.bmp (chainsaw isologo, orange sun disc). Fix: render as PNG/SVG above login card + small in TopBar. Command: /impeccable colorize
- [P2] Focus ring at 20% opacity — invisible in bright workshop lighting; WCAG 2.4.7 failure. Fix: focus:ring-2 at full opacity. Command: /impeccable audit
- [P2] No forgot-password / contact-admin path. Fix: link with WhatsApp contact (number in PRODUCT.md). Command: /impeccable clarify
- [P2] Index page is an unnecessary interstitial ("Go to Login"). Fix: redirect / to /login or merge. Command: /impeccable distill
- [P3] No password visibility toggle; placeholder contrast ~2.8:1 (WCAG 1.4.3 failure). Fix: eye toggle + full-opacity placeholder token. Command: /impeccable polish

## Persona Red Flags

- Casey (distracted mobile): form state lost on interruption (no sessionStorage draft); full login every time, no biometric/PIN; extra tap via index page.
- Mecánico Mateo (dirty hands, reads little): English labels/errors; "Invalid email address" meaningless to him; no password toggle with greasy fingers.
- Sam (accessibility): focus ring invisible; placeholder ~2.8:1; role="alert" and labels correct.

## Minor Observations

1. Logo in BMP format is not web-friendly — convert to PNG/SVG with transparent background.
2. errorComponent in __root.tsx duplicates Button styles instead of using the Button component.
3. TopBar avatar is a dead element (no logout/profile action).
4. Bottom-nav "Menu" is an ambiguous catch-all label.
5. Password minimum of 6 chars is weak for stock data (security decision, not design).

## Questions to Consider

1. If Mateo sees this blue English login on his phone, does he know it is his system?
2. Why does the most-used app of the day demand full email+password every time instead of optimizing re-entry?
3. Does the index page serve anyone, or is it a scaffolding artifact?
