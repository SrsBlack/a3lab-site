---
name: A3 Lab
description: Done-for-you agentic AI automation studio for lean teams.
colors:
  signal-cyan: "#22d3ee"
  signal-cyan-hover: "#06b6d4"
  signal-cyan-active: "#0891b2"
  operator-amber: "#f59e0b"
  operator-amber-hover: "#d97706"
  bg: "#0a0b0f"
  surface: "#111318"
  surface-2: "#181a21"
  surface-offset: "#1e2028"
  border: "#2a2d38"
  divider: "#1f2230"
  text: "#e4e6ec"
  text-muted: "#8b8f9e"
  text-faint: "#5a5e6e"
  text-inverse: "#0a0b0f"
  success: "#34d399"
  error: "#f87171"
  bg-light: "#f8f9fc"
  surface-light: "#ffffff"
  text-light: "#111827"
  signal-cyan-light: "#0891b2"
  operator-amber-light: "#d97706"
typography:
  display:
    fontFamily: "Cabinet Grotesk, Helvetica Neue, sans-serif"
    fontSize: "clamp(2.75rem, 0.5rem + 5vw, 5.5rem)"
    fontWeight: 800
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Cabinet Grotesk, Helvetica Neue, sans-serif"
    fontSize: "clamp(2rem, 1.2rem + 2.5vw, 3.5rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Cabinet Grotesk, Helvetica Neue, sans-serif"
    fontSize: "clamp(1.5rem, 1.2rem + 1.25vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Satoshi, Inter, sans-serif"
    fontSize: "clamp(1rem, 0.95rem + 0.25vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Satoshi, Inter, sans-serif"
    fontSize: "clamp(0.875rem, 0.8rem + 0.35vw, 1rem)"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
  full: "9999px"
spacing:
  "1": "0.25rem"
  "2": "0.5rem"
  "3": "0.75rem"
  "4": "1rem"
  "5": "1.25rem"
  "6": "1.5rem"
  "8": "2rem"
  "10": "2.5rem"
  "12": "3rem"
  "16": "4rem"
  "20": "5rem"
  "24": "6rem"
  "32": "8rem"
components:
  button-primary:
    backgroundColor: "{colors.signal-cyan}"
    textColor: "{colors.text-inverse}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1.5rem"
  button-primary-hover:
    backgroundColor: "{colors.signal-cyan-hover}"
    textColor: "{colors.text-inverse}"
  button-primary-large:
    backgroundColor: "{colors.signal-cyan}"
    textColor: "{colors.text-inverse}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "1rem 2rem"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1.5rem"
  button-outline-hover:
    backgroundColor: "transparent"
    textColor: "{colors.signal-cyan}"
  input-field:
    backgroundColor: "{colors.surface-offset}"
    textColor: "{colors.text}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0.75rem 1rem"
  card-surface:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
---

# Design System: A3 Lab

## 1. Overview

**Creative North Star: "The Command Layer"**

A3 Lab's site IS what A3 Lab sells: a calm, organized control surface that runs the unsexy ops layer of a business so the team can focus on higher-leverage work. Every design decision asks one question — does this feel like a senior operator's terminal, or a marketing site cosplaying as one? The answer governs typography weight, color saturation, motion budget, and copy register simultaneously.

The system is dark by default — a deep charcoal (#0a0b0f) closer to a dimmed late-night console than the navy-blue corporate dark of B2B SaaS. Light theme exists as a parity layer, not a primary register; the brand lives at night. Surfaces are flat at rest. Elevation comes from a single signature glow: the primary cyan radiating ~24px around active states, never from drop shadows used decoratively. Type is a confident pairing of Cabinet Grotesk display (heavy, geometric, slightly editorial) over Satoshi body (warm grotesque, technical without being cold). Spacing is generous — the system breathes. Color is restrained: 90% neutrals + tinted surfaces, signal cyan reserved for primary action and live state, operator amber held for the human-in-the-loop moments where a person reviews what the agents did.

This system explicitly rejects: purple/cyan neon gradients on dark backgrounds, glassmorphism cards stacked on robot illustrations, hero-metric templates (huge number + tiny label), identical 3-card grids repeating endlessly, gradient text on every heading, scrolling logo clouds, and the entire "AI agency template" lane. It also rejects corporate-consultancy stiffness (navy + grey + stock photos of diverse-people-in-suits) and marketing-bro funnel energy (urgency stacking, orange-arrow emojis, "crushing it" copy). Quiet is louder than loud here. We compete against agencies that scream by refusing to.

**Key Characteristics:**
- Operator-grade · confident · quietly technical (the strategic register)
- Dark by default, light as parity
- 90/10 color: neutrals dominate, signal cyan + operator amber are scarce by design
- Flat surfaces + signal-color glow as the only elevation signature
- Cabinet Grotesk display (geometric weight) over Satoshi body (warm precision)
- Generous spacing scale; the system breathes rather than packs
- Motion is exponential ease-out at 180ms — present but never showy
- Every visual decision earns its place; restraint is the brand

## 2. Colors: The Command Layer Palette

The palette is 90% tinted neutrals + two named signals. Restraint is structural: the primary cyan and operator amber appear together on roughly 10% of any given surface. When they grow louder than that, the page is failing the brand.

### Primary

- **Signal Cyan** (#22d3ee): The primary action layer. Every CTA button background, the live-orchestration step glow, focus rings, link hover state, the "command stack online" indicator. When you see signal cyan on an A3 Lab surface, it means *something is active or actionable right now*. The hover deepens to a more committed tone (#06b6d4); the active press lands at (#0891b2). Light theme uses the deeper cyan (#0891b2) as primary so it survives a bright background without becoming a glow itself.

### Secondary

- **Operator Amber** (#f59e0b): The human-in-the-loop accent. Used for moments where a person reviews what the agents did — approval gates, audit timestamps, "Operator notified only if needed" indicators, friction points by design. Amber is warmer and slower than cyan; that's the point. Cyan is automation. Amber is the human. Hover state at (#d97706). Light theme uses (#d97706) as the accent.

### Neutral

- **Console Charcoal** (#0a0b0f): The page background. Deeper than navy, warmer than pure black, tinted toward the brand hue. Never #000 — the small chroma lift is what keeps the surface from looking like a void.
- **Surface** (#111318): The first elevation step — header, primary card, hero command panel.
- **Surface 2** (#181a21): The second step — service cards, pricing tiers, FAQ panels.
- **Surface Offset** (#1e2028): The third step — input fields, nested panels, the "darker than the card it sits on" surface.
- **Border** (#2a2d38): The default border. 1px, never thicker as a colored stripe.
- **Divider** (#1f2230): Section breaks within a surface; quieter than border.
- **Text** (#e4e6ec): The primary body text on dark.
- **Text Muted** (#8b8f9e): Secondary text, section descriptions, supporting copy.
- **Text Faint** (#5a5e6e): Placeholder text, deprecated states. Never use for any text the user is meant to read.
- **Text Inverse** (#0a0b0f): Text on light or saturated surfaces (e.g. inside a primary cyan button).

### State

- **Success Mint** (#34d399 dark / #059669 light): Confirmed, deployed, healthy.
- **Error Coral** (#f87171 dark / #dc2626 light): Failed, blocked, requires attention. Coral over crimson — keeps the warning serious without screaming.

### Light Theme (parity)

Light theme exists for accessibility and user preference, not as the primary register. Background (#f8f9fc), surface (#ffffff), text (#111827). The brand still belongs to the dark.

### Named Rules

**The 10% Rule.** Signal Cyan + Operator Amber together occupy ≤10% of any given screen. Their rarity is the entire point. When you find yourself coloring three things the same accent, two of them are wrong.

**The No-Gradient Rule.** No background-clip gradient text, ever. The current site has gradient-text on a few headings — those are debt to be repaid, not a pattern to extend. Emphasis comes from weight, scale, and color contrast — not from a rainbow on the headline.

**The Tinted-Black Rule.** Every neutral is tinted toward the cyan hue, not pure greyscale. The chroma is small (often under 0.01 in OKLCH terms), but the discipline is absolute. Pure #000 and pure #fff are forbidden.

## 3. Typography

**Display Font:** Cabinet Grotesk (with Helvetica Neue, sans-serif fallback)
**Body Font:** Satoshi (with Inter, sans-serif fallback)

**Character:** Cabinet Grotesk is a geometric grotesque with editorial weight — it carries the "Lab" half of "A3 Lab" honestly without tipping into magazine territory. Satoshi is a warm precision sans that handles long-form copy and UI labels equally well. Together they read as "senior engineer who reads books" — confident, deliberate, slightly literary, never marketing-bro. Both load from Fontshare with display=swap.

The scale is fluid (clamp-based) on every step. Type breathes between viewports rather than snapping at breakpoints.

### Hierarchy

- **Hero** (800, clamp(2.75rem, 0.5rem + 5vw, 5.5rem), 1.05, -0.02em): Reserved for the homepage hero only. One H1 per page; this size is the loudest the system gets.
- **Display** (800, clamp(2.5rem, 1rem + 4vw, 5rem), 1.1, -0.02em): Page titles on inner pages.
- **Headline** (800, clamp(2rem, 1.2rem + 2.5vw, 3.5rem), 1.1, -0.02em): Section titles. The dominant sectioning typography across the site.
- **Title** (700, clamp(1.5rem, 1.2rem + 1.25vw, 2.25rem), 1.15, -0.01em): Card titles, sub-section headers.
- **Body** (400, clamp(1rem, 0.95rem + 0.25vw, 1.125rem), 1.6): Paragraphs, descriptions. Capped at 72ch maximum line length.
- **Body Large** (400, clamp(1.125rem, 1rem + 0.75vw, 1.5rem), 1.5): Hero subtitle, lead paragraphs that need a confidence boost.
- **Label** (500, clamp(0.875rem, 0.8rem + 0.35vw, 1rem), 1.4, +0.02em): Buttons, form labels, badge text. Never below 14px.
- **Caption** (400, clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem), 1.4): Metadata, timestamps, fine print. Used sparingly.

### Named Rules

**The One-H1 Rule.** Each page gets exactly one H1, sized at the Hero or Display step. Multiple H1s dilute the page's claim about what it's for.

**The 72ch Rule.** Body copy never exceeds 72 characters per line. This is a readability floor, not a style suggestion. Long-form sections must constrain `max-width` even on wide viewports.

**The Tracking-Tight Rule.** Display/Headline/Title all sit at slightly negative letter-spacing (-0.02em / -0.01em). This is what keeps Cabinet Grotesk from looking sparse at large sizes. Body and Label stay at normal or +0.02em (labels). Never positive tracking on display type.

## 4. Elevation

**Mostly flat + signal glow.** Surfaces sit flat at rest. Depth is conveyed primarily through tonal layering on the surface scale (bg → surface → surface-2 → surface-offset), not through shadows. The signature elevation move is a single signal-cyan glow that appears on active and hover states — `box-shadow: 0 0 24px rgba(34, 211, 238, 0.15)` — never a drop shadow used decoratively.

Drop shadows exist (sm/md/lg defined) but are reserved for elements that genuinely lift off the page: dropdown menus, modals, sticky headers crossing scroll boundaries, cards lifting on hover. They are functional, never atmospheric. If a card looks "more designed" with a shadow at rest, the shadow is wrong — fix the surface scale instead.

### Shadow Vocabulary

- **shadow-sm** (`0 1px 2px rgba(0,0,0,0.3)` dark / `0 1px 2px rgba(0,0,0,0.06)` light): Subtle separation for sticky headers and toolbars.
- **shadow-md** (`0 4px 12px rgba(0,0,0,0.4)` dark / `0 4px 12px rgba(0,0,0,0.08)` light): Cards on hover, dropdown menus, popovers.
- **shadow-lg** (`0 12px 32px rgba(0,0,0,0.5)` dark / `0 12px 32px rgba(0,0,0,0.12)` light): Modals, command palettes, the rare element that needs to dominate.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadows appear only as a response to state (hover, active, elevated above scroll), never as decoration on a static element.

**The Glow-Is-Signal Rule.** The signal-cyan glow on `:hover` and `:focus-visible` is the brand's elevation signature. It carries the "live, active, online" meaning that maps to your product (live orchestration, command stack online). Don't dilute it with secondary glows on other accent colors.

**The Reduced-Motion-At-Definition Rule.** Every animation must have a paired `@media (prefers-reduced-motion: reduce)` override declared at the same point in the source as the animation itself, not retrofitted later. The pattern in `effects.css` §4 is the template — animation block, then immediate paired reduced-motion override. Audit any new motion against this discipline at PR review.

## 5. Components

### Buttons

- **Shape:** Slightly rounded — `rounded-md` (0.5rem) on default, `rounded-lg` (0.75rem) on large size. Never pill (`rounded-full`) for primary actions; pills are for status badges only.
- **Primary:** Signal cyan background, inverse text (deep charcoal), 600 weight, label typography. Padding 0.75rem 1.5rem default, 1rem 2rem on large.
- **Hover:** Background shifts to `signal-cyan-hover` (#06b6d4), translates -1px on Y axis, gains a 24px signal-cyan glow.
- **Active:** Translation returns to 0 (the press settles).
- **Focus-visible:** 2px signal-cyan outline, 3px offset (defined globally in `base.css`).
- **Outline (secondary):** Transparent background, body text color, 1px border in the default border color. Hover: border and text both shift to signal cyan.
- **Tactile feel:** The -1px hover translate is the entire interaction language. Don't add scale, rotate, or gradient sweeps. Restraint at rest, deliberate response on interact.

### Form Inputs

- **Shape:** `rounded-md` (0.5rem). Same radius family as buttons; inputs and buttons read as siblings.
- **Style:** 1.5px solid border (in the default border color), surface-offset background, body text color, body typography. Padding 0.75rem 1rem.
- **Placeholder:** Text-faint color. Placeholder is never the label — labels are always visible above the field.
- **Focus:** Outline removed, border shifts to signal cyan, 3px signal-cyan-glow ring (`box-shadow: 0 0 0 3px rgba(34, 211, 238, 0.15)`). The ring carries the elevation language consistent with buttons.
- **Textarea:** Resize vertical only, 120px minimum height.
- **Error:** Coral border + `aria-live` announcement. Color alone is never the only cue.

### Cards / Containers

- **Corner Style:** `rounded-lg` (0.75rem) for content cards, `rounded-md` (0.5rem) for compact tiles.
- **Background:** Surface or surface-2 depending on the page's existing surface (cards step *up* one level from their parent).
- **Border:** 1px in the default border color. Full borders only — **never side-stripe borders** (>1px on a single side as a colored accent).
- **Internal Padding:** 1.5rem default, scales up to 2rem on hero/feature cards.
- **Shadow Strategy:** Flat at rest. Shadow-md on hover only when the card is interactive (whole card is a link or button).
- **Nested cards are forbidden.** If you find yourself wrapping a card inside a card, restructure — the inner element should be a non-card surface (a divider, a list item, a section).

### Navigation

- **Desktop nav:** Inline horizontal links in body typography, label weight (500). Default text color shifts to signal cyan on hover. Sticky to viewport top with `shadow-sm` only when scrolled past the hero.
- **Dropdown menus:** Surface-2 background, full border, `rounded-md`, `shadow-md`. Items have 0.75rem 1rem padding. Active item gets signal cyan text, never background fill.
- **Mobile nav:** Full-screen drawer that slides from right. Same hover/active rules. Close affordance at top-right with the same hit target floor (44×44px).
- **Theme toggle:** Sun/moon SVG icon button, 20×20 icon inside a 44×44 hit target. Toggles `data-theme` on `:root`. **Animated via `document.startViewTransition`** — a click-origin clip-path circle expands from cursor coordinates over 220ms with the system `cubic-bezier(0.16, 1, 0.3, 1)` easing. Falls back to instant toggle when `startViewTransition` is unsupported. The expanding circle is the brand's only signature page-level transition; do not add view transitions on other surfaces without explicit reason.

### Section Title

- **Style:** Display font, 800 weight, headline typography size, -0.02em tracking. Sits 4 spacing units above its associated description.
- **Description:** Body typography in text-muted color, max 60ch, 12 spacing units of bottom margin before the section content begins.
- **The two together are the section heading unit.** They travel as a pair; don't ship one without the other.

### Hero Command Panel (signature component)

The "Live orchestration" step list in the hero (Steps 01-04) is the system's signature component. It is not a generic timeline — it embodies the brand. Surface-2 background with full border, signal-cyan left-edge accent on the active step (the `is-active` class), monospace-feeling step numbers, label typography for the description. Each step is a row in a vertical stack with `space-3` gap. **Do not re-skin this as a horizontal stepper or numbered card grid.** Its shape carries meaning.

### Typing-Cursor Utility (scoped)

A pure-CSS blink primitive at `effects.css` §2: a 2px wide × 1em tall signal-cyan bar with `animation: blink-cursor 0.7s step-end infinite`. Apply via `<span class="typing-cursor"></span>` after a single static phrase that genuinely benefits from a "command line" register — a chatbot input, a single hero phrase, the end of a status line. **Forbidden uses:** sequenced typing-out of multi-line text (the Hero Command Panel must read as already-running and observable, not as a fake demo loading), as decoration on every CTA, as ambient noise. The cursor reads as "live terminal" only when reserved for one purposeful location.

## 6. Do's and Don'ts

### Do:

- **Do** keep the 90/10 ratio: 90% tinted neutrals, 10% combined signal cyan + operator amber. The rarity is the brand.
- **Do** use signal cyan for primary actions and live state only. Every cyan element should answer "is this actionable or actively running right now?" with yes.
- **Do** use operator amber for human-in-the-loop moments specifically — approval gates, audit indicators, friction-by-design moments. Never as a "second accent for variety."
- **Do** lead every section with the section-title + section-description pair. They travel together.
- **Do** keep elevation flat at rest. The signal-cyan glow on hover is the only signature lift the system has.
- **Do** ship `prefers-reduced-motion` respect on every new animation (already implemented globally in `base.css` — keep extending, never opt out).
- **Do** keep focus-visible rings at the existing 2px signal-cyan / 3px offset minimum. This is the floor.
- **Do** verify cyan + amber distinguishability across deuteranopia and protanopia when adding new color-coded UI states.
- **Do** keep body line length capped at 72ch and labels at 14px floor.
- **Do** use Cabinet Grotesk display only; if you reach for a third typeface, you're patching a problem the existing pairing should solve.

### Don't:

- **Don't** use background-clip: text gradients on any heading. The current site has a few — those are debt, not a pattern. Solid color, weight contrast, and scale carry hierarchy.
- **Don't** use side-stripe borders (border-left or border-right >1px as a colored accent on cards, list items, callouts). Use full borders, leading numbers, or background tints instead.
- **Don't** use the hero-metric template (huge number + tiny label + supporting stat row). It's a SaaS landing-page cliche.
- **Don't** ship identical 3-card grids with icon + heading + 2-line description repeated endlessly. Vary structure when content varies.
- **Don't** wrap cards inside cards. Ever. Restructure to use a non-card inner surface (divider, list item, section).
- **Don't** use glassmorphism — backdrop-filter blur as decoration. Surfaces are solid; the only "glass" allowed is purposeful UI like an overlay backdrop.
- **Don't** use modals as the first thought. Exhaust inline and progressive alternatives first.
- **Don't** drift into generic AI-agency territory: purple/cyan radial gradients on dark, neon cyber grids, robot mascots in hero, "unleash the power of AI" copy. The current Spline robot iframe is debt — rework it, don't extend it.
- **Don't** drift into corporate-consultancy territory: navy + grey palettes, stock photos of diverse-people-in-suits, "thought leadership" boilerplate paragraphs, "trusted by industry leaders" without naming any.
- **Don't** drift into marketing-bro territory: orange-arrow emojis, urgency stacking ("LIMITED SPOTS", "BOOK BEFORE FRIDAY"), countdown timers, "crushing it" / "game-changer" / "no-brainer" copy.
- **Don't** use pure #000 or pure #fff. Every neutral tints toward the brand hue.
- **Don't** use bounce or elastic easing. Exponential ease-out (cubic-bezier(0.16, 1, 0.3, 1)) at 180ms is the entire motion vocabulary.
- **Don't** animate CSS layout properties (width, height, margin). Animate transform and opacity only.
- **Don't** use em dashes. Use commas, colons, semicolons, or parentheses.
- **Don't** add a "Layout" or "Motion" or "Responsive" top-level section here later. Fold that content into Overview (philosophy) or Components (per-element behavior). The six-section spec is fixed.
