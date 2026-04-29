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

Founder-credibility section shipped 2026-04-29 (commit 4932057): replaced three fabricated testimonial cards (Marketing Agency Owner / E-commerce Operations Lead / Solo Consultant — fake names, fake numbers) with a "Who builds this" section. Three `.story-card` blocks reference real systems the founder ships and operates: live algorithmic trading bridge on a funded prop account, PROOF social app (70 screens / 222 backend tests / audited E2E crypto), and Agentic Trend Intelligence (LangGraph + Gemini + Printify + Shopify production pipeline). New `.founding-strip` block below carries the founding-customer programme banner with `--color-accent` left-rule (the studio's first non-cyan accent use, justified because the strip carries time-limited intent and meaning) — soft register, no "LIMITED SPOTS" urgency-stacking, links #contact. Dead CSS removed: `.testimonials-grid`, `.testimonial-card`, `.testimonial-stars`, `.testimonial-author`, `.testimonial-avatar` (73 lines). PRODUCT.md principle 1 ("show don't claim") now holds end-to-end on the homepage.

Pricing CTAs + process gradient + light-theme contrast shipped 2026-04-29 (commit dc75ab6): pricing-card CTAs unified by buyer-stage intent (Starter "Start a build" / Pro "Plan your build" / Retainer "Discuss a retainer"). Process-list connector dropped `--gradient-brand` (cyan→amber→cyan inline gradient) for a flat 1px `--color-border` line — direct No-Gradient Rule violation paid down. Light-theme `--color-text-faint` raised from #9ca3af (2.84:1 on white, borderline) to #737985 (4.78:1 on white, 4.55:1 on surface-2 — passes WCAG AA for normal text on both light backgrounds). Hierarchy preserved: faint still sits just below muted (#6b7280).

Site-wide credibility sweep shipped 2026-04-29 (commit 1aa2165): removed fabricated stats and case studies across 6 files (index, customer-support-bots, lead-enrichment, for-agencies, for-ecommerce, for-consultants). Homepage service cards `Typical time saved: 10-15 hrs/week` → `Designed to free up`. Chatbot script: agency/ecommerce suggestion stats removed; `flowExample` fake case study (`15 hrs/week, tripled outreach, 40% rate`) rewritten as capability description with reviewable-drafts + human-approval framing. Audit `recMap` support/reporting descriptions reframed. Inner-page `Case Story: How a [vertical] [cut/doubled] [N hrs/X%]` sections rewritten as `A typical [vertical] build` — same three-layer structure but framed as the studio's standard build pattern with no fabricated outcome stats. Service-page hero `Let AI handle 60-70% of support tickets` → capability framing. PRODUCT.md principle 1 ("show don't claim") now holds across all 9 public pages.

impeccable critique pass shipped 2026-04-29 (Wave 1 commit b63b2dc + Wave 2 commit 1a24a8e): user dissatisfied with site visual after content polish. Critique scored 22/40 with 1/4 on Aesthetic & Minimalist Design. **Wave 1** stripped AI-agency tells: hero neon grid (`.hero-bg::before`), hero amber radial glow + cyan text-shadow + badge-pulse animation, `.service-card::before` gradient hover, animated cyan→amber shimmering `.section-divider`, `.work-with-us-strip` cyan→amber background, FAQ side-stripe border, ROI CTA arrow emoji, 14 primary-button arrow tails, 9 footer h2→h4 skipped headings, 9 multi-word uppercase labels. Detector 28 → 1. **Wave 2** redesigned per user-chosen Option B (Linear/Vercel minimal dark): homepage collapsed from 14 sections to 6 (Hero → Who builds → Services → Pricing → Audit → Contact). Services rebuilt as `.service-list` typographic list (large display-font row numbers, h3 + body + tag row with middot separators, link on right). Three new standalone pages: `/faq.html` (FAQ extracted from homepage), `/roi-calc.html` (calculator extracted), `/how-we-work.html` (process extracted). Header nav simplified to Services / Industries / Pricing / FAQ / Book a call. Section padding scaled up (clamp 16/10vw/32). `.section-narrow` modifier caps inner width at 960px. Section-titles 22ch, section-descs 60ch. 8 residual letter-spacing 0.08em values dropped from non-uppercase selectors. Detector 1 → 0 across 13 pages.

Deferred (still open):
- Real client wins: when the founding-customer cohort delivers, swap "Who builds this" credibility cards for attributed case studies with named clients + verifiable numbers. The strip becomes redundant once cases are live. Per-page "A typical [vertical] build" sections then either remain as build-pattern teaching content or get replaced with attributed cases.
- Founding-customer programme terms (slot count, rate) still abstract — when user decides exact terms, tighten the strip copy.
- Audit external surfaces (LinkedIn, X, email outreach) for the same pre-launch-claim discipline the site now holds.
- Possible Wave 3 polish if user wants more sharpening on hero or services list after viewing live (no IA changes needed for that).

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
