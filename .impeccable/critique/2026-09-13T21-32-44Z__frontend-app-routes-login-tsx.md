---
target: login surface (login.tsx + shell)
total_score: 25
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 0
target_identity: "file:D:\\GitHub\\GestorStock\\frontend\\app\\routes\\login.tsx"
target_fingerprint: "sha256:baef5f479f37e817ab165a6ff258aef669ee07aac02c859121597bedeff3292b"
target_path: "D:\\GitHub\\GestorStock\\frontend\\app\\routes\\login.tsx"
timestamp: 2026-09-13T21-32-44Z
slug: frontend-app-routes-login-tsx
---
# Impeccable Design Critique RE-RUN — GestorStock Login Surface

Method: dual-agent (A: ses_f635398e · B: ses_f6353956). Browser visualization skipped: CLI detector returned clean again (0 findings), nothing to visualize.

## Design Health Score (Nielsen, 0-4)

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | No "session expired" toast when redirected to login |
| 2 | Match System / Real World | 2 | "Correo electrónico" formal; workshop would say "Tu email" |
| 3 | User Control and Freedom | 3 | WhatsApp escape hatch works; no "remember me" |
| 4 | Consistency and Standards | 3 | Tokens consistent; 404 duplicates Button styles inline |
| 5 | Error Prevention | 3 | Missing autoCapitalize="none" on email (iOS capitalizes) |
| 6 | Recognition Rather Than Recall | 2 | Password placeholder doesn't communicate 6-char minimum |
| 7 | Flexibility and Efficiency | 2 | No remember-me on shared workshop phone |
| 8 | Aesthetic and Minimalist Design | 3 | Clean but lacks workshop warmth |
| 9 | Error Recovery | 3 | Voseo correct; no hierarchy between form vs field errors |
| 10 | Help and Documentation | 2 | Only WhatsApp link; no orientation for new mechanics |
| **Total** | | **25/40** | Acceptable band (20-32), improving toward Good |

Previous run: 18/40. Improvement: +7 driven by palette overhaul, Spanish copy, logo integration, a11y fixes.

## Design Specificity Verdict

Branded but not authored. The Argojardín orange palette is present in tokens and the logo is placed, but the login reads as a generic clean auth form with a logo stamp. Specificity lives entirely in the logo file; the design system carries it nowhere further. No trade-specific emotional texture (STIHL/ECHO service culture, workshop context).

## Previous 7 Fixes — Verdicts

All 7 landed well. Focus ring fix landed but is marginal (3.12:1 vs 3:1 minimum). No regressions.

## Remaining Priority Issues

- [P2] Focus ring marginal contrast: primary-500 on white offset = 3.12:1 (passes by 0.12). Fix: ring-primary-600 (~4.89:1). Command: /impeccable polish
- [P2] Missing autoCapitalize="none" + spellCheck={false} on email field — iOS capitalizes first letter, causing inexplicable validation errors. Command: /impeccable polish
- [P2] Dashboard placeholder exposed to users ("El contenido llegará en Sprint 3") — dev note in production, erodes trust at peak-end moment. Fix: greeting + quick links, or redirect to /products. Command: /impeccable onboard (or manual)
- [P3] danger token fails AA for small text: oklch(0.6 0.2 25) = 4.27:1 at 14px. Fix: darken to oklch(0.55 0.2 25). Command: /impeccable polish
- [P3] No workshop warmth: missed "bienvenido de vuelta" / Argojardín context opportunity on login. Command: /impeccable delight

## Persona Red Flags

- Casey: no remember-me → re-typing credentials after every workshop interruption.
- Mecánico Mateo: typing email with dirty hands; 20-char label "Correo electrónico" vs faster "Tu email"; no inline hint of 6-char minimum.
- Sam: keyboard flow fully works; toggle ring visually tight inside input.

## Minor Observations

1. placeholder token at 7.27:1 AAA ✓. 2. Logo alt strategy consistent (named on login, aria-hidden in TopBar). 3. Safe-area insets PWA-safe ✓. 4. $.tsx 404 uses inline button styles instead of Button component. 5. "Cargando…" ellipsis correct Spanish. 6. Voseo imperatives correct throughout. 7. WhatsApp link format correct (549 prefix). 8. TopBar "?" avatar is defensive code, not a bug.
