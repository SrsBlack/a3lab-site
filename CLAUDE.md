# A3 Lab Website

Static marketing site for [a3lab.ca](https://a3lab.ca). Plain HTML/CSS/JS, no build step. Deployed via the SrsBlack/a3lab-site GitHub repo.

## Design Context

This project uses [impeccable](https://github.com/pbakaus/impeccable) for design fluency. Two source-of-truth files at the project root drive every design decision:

- **`PRODUCT.md`** — strategic context: register, users, brand personality, anti-references, design principles, accessibility floor.
- **`DESIGN.md`** — visual context (Stitch six-section format): colors, typography, elevation, components, do's and don'ts. Backed by a `DESIGN.json` sidecar carrying tonal ramps, motion tokens, and full component HTML/CSS for Stitch's live panel.

**Read both before designing or editing UI.** The skill's `load-context.mjs` does this automatically; if you're working without it, read them yourself.

### Strategic anchors (from PRODUCT.md)

- **Register:** brand. The site IS the product — design carries the trust.
- **Users:** founders / ops leads at lean teams (5-50 people). Skeptical of hype, time-poor, want credibility in 3 minutes.
- **Brand personality:** operator-grade · confident · quietly technical.
- **Five strategic principles:** show don't claim · restraint is the brand · practice what we preach · operator over funnel · specificity wins.

### Visual anchors (from DESIGN.md)

- **Creative North Star:** "The Command Layer."
- **Color:** 90% tinted neutrals + 10% Signal Cyan (#22d3ee) and Operator Amber (#f59e0b). The rarity is the brand.
- **Type:** Cabinet Grotesk display + Satoshi body.
- **Elevation:** flat at rest; only signature is the signal-cyan glow on hover.
- **Motion:** exponential ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`) at 180ms. No bounce, no elastic.

### Anti-references (carried verbatim from PRODUCT.md)

The site must never look or feel like:

- Generic AI-agency clichés (purple/cyan gradients, neon grids, robot mascots, glassmorphism)
- SaaS landing-page templates (hero-metric template, identical 3-card grids, gradient text on every heading)
- Marketing-bro funnel energy (urgency stacking, orange-arrow emojis, "crushing it" copy)
- Corporate-consultancy stiffness (navy+grey, stock photos, "thought leadership" boilerplate)

### Effects layer history

`effects.css` (88 lines) and `effects.js` (116 lines) are the **post-distill** survivors after `/impeccable critique` ran on 2026-04-29. The original 2026-03-30 "futuristic UI effects" layer (537 + 752 lines) failed the operator-grade register at 16/23 effects and was distilled aggressively — particle canvas, scanline overlay, gradient blobs, floating orbs, glitch text, custom cursor, card 3D tilt, magnetic buttons, text scramble, counter scramble, and typing-terminal sequencer all dropped. Three patterns survived as worth-keeping primitives: scroll progress bar (no halo), view-transition theme wipe (system-aligned to 220ms exp-out), and CSS typing-cursor primitive. Pattern reasoning is captured in DESIGN.md §4-§5.

Outstanding debt:
- Hero rework shipped 2026-04-29: gradient-text + glitch-hover stripped from all H2s; both `.gradient-text` CSS rules removed. Spline 3D robot iframe replaced with the brand's own signature Hero Command Panel as the right-column anchor; `.hero-robot` block + `robotGlowPulse` keyframes + glassmorphism backdrop-blur on `.hero-command` all dropped. OpenClaw-section retrofuturism Spline iframe remains.
- A11y pass shipped 2026-04-29: `--text-xs` token raised to 14px floor (clamp 0.875rem→1rem); 13 raw sub-14px font-size declarations lifted to var(--text-xs); theme toggle now syncs aria-label + aria-pressed on init and click. Light-theme `--color-text-faint` contrast (3.4:1 borderline) and uppercase-on-body-phrases still deferred.
- Conversion-path pass shipped 2026-04-29: removed unverifiable stats bar (3.7× ROI, 15 hrs, 24-72h with glassmorphism backing), replaced with operator-grade `.stack-strip` showing the actual tools (Perplexity, Claude, OpenAI, Zapier, n8n, OpenClaw, Notion). Reframed "Automation Stories" into "Patterns We Build" — same workflow detail, dropped the unattributed agency/e-commerce/consultant case-study framing and the 40%/65%/3× claims that read fake. PRODUCT.md principle #1 ("Show, don't claim") now holds across the homepage. Pricing tier-label emoji (⭐, 🔄) dropped — text alone does the work in the operator register.
- Inner-page polish pass shipped 2026-04-29: 5 service pages + 3 industry pages + automation-box. `.stats-bar` CSS refactored from glassmorphism to flat surface-2 + full border, auto-fit grid for 2-4 cards, neutral stat-value color (10% color-rarity rule preserved). Per-page stat-bar content rebuilt to verifiable facts only (delivery times, tool names, integration targets, "human handoff built in") — dropped fabricated "X hrs saved", "Y× faster", "Z% auto-handled" repeated across pages. Theme-toggle a11y fix from commit 3b29bd1 propagated to all 9 pages with toggles. automation-box.html: 4 emoji feature icons (📦🔒⚡🧠) replaced with operator-grade inline SVGs using `--color-primary`; `.autobox-pitch-icon` CSS adapted from `font-size` to flex-center SVG container.

Hero copy + CTA hierarchy shipped 2026-04-29 (commit 4a0d09e): subhead dropped the "operates like it has an always-on command layer" marketing tail and replaced with operator-grade specificity (the four agent classes, plus 48h ship and human-approval facts). CTA stack collapsed — audit is now sole primary; Calendly demoted to a quiet underlined text link ("Prefer to talk first? Book a 30-minute strategy call") below the button row, with `--color-text-faint` underline brightening to Signal Cyan on hover. New `.hero-actions-aux` selector group in style.css.

Deferred (still open):
- Pricing-card CTA labels uneven (Starter→Get Started, Pro→Book a Call, Retainer→Learn More) — all point to #contact; either unify or differentiate destinations.
- Process-list connector line still uses `--gradient-brand` (style.css ~3899) — decorative 1px line, not under No-Gradient Rule, worth a future call.
- Real client wins: when available, swap Patterns section back to attributed case studies with named clients + verifiable numbers. Highest-leverage proof move.

## Working with impeccable

Run any of these from the project root:

```bash
/impeccable critique <target>   # UX design review
/impeccable audit <target>      # Technical quality (a11y, perf, responsive)
/impeccable polish <target>     # Final pass before shipping
/impeccable harden <target>     # Add error states, edge cases, i18n
/impeccable bolder <target>     # Amplify a bland section
/impeccable quieter <target>    # Tone down an overstimulating section
/impeccable typeset <target>    # Improve typography hierarchy
/impeccable layout <target>     # Fix spacing and rhythm
```

Or invoke the skill directly with a free-form description:

```
/impeccable redo this hero section
```

Full command list: `/impeccable` (no args).

## Repo layout

```
a3lab-site/
├── index.html              # Main landing page (~2700 lines)
├── automation-box.html     # Productized SKU page
├── for-agencies.html       # Industry vertical
├── for-consultants.html    # Industry vertical
├── for-ecommerce.html      # Industry vertical
├── services/               # 5 service deep-dives
├── assets/                 # Images, hero PNG, OG cards
├── base.css                # Reset + global rules
├── style.css               # Design tokens + component styles (~3500 lines)
├── PRODUCT.md              # Strategic design context (impeccable)
├── DESIGN.md               # Visual design system (impeccable, Stitch format)
├── DESIGN.json             # Visual sidecar (impeccable, tonal ramps + components)
├── CLAUDE.md               # This file
├── README.md
├── robots.txt
└── sitemap.xml
```

## Deployment

The site is plain static files. No build step. Push to `main` on `SrsBlack/a3lab-site` to deploy to a3lab.ca.
