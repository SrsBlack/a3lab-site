# Product

## Register

brand

## Users

Founders, ops leads, and small-team operators at lean companies (5-50 people) — agencies, e-commerce brands, consultancies. They run the business themselves, feel the cost of manual work daily, and are time-poor. They arrive via search ("AI automation consultant", "agentic workflows for X") or referral, already half-convinced they need help but skeptical of hype. They're shopping for a partner, not a tool.

Their context when they land: 3 minutes between meetings, scanning on a laptop or phone, evaluating credibility. The job to be done is **decide whether A3 Lab is credible enough to book a 30-minute discovery call**. Education comes later — on the site itself, the only outcome that matters is trust + clarity → CTA.

## Product Purpose

A3 Lab is a done-for-you agentic AI automation studio. We design and ship custom AI workflows — lead enrichment pipelines, content engines, support bots, OpenClaw-based command layers — for teams that don't want to hire engineers or stitch together SaaS. We sell architecture-and-implementation engagements (Starter Build, Pro System) plus monthly retainers, not a product license.

Success for the website: the right visitor (a lean-team operator with a real automation need) leaves with three things — (1) a concrete sense of what we actually build, (2) belief that we run real systems rather than slideware, (3) a low-friction next step (free audit form, Calendly call, or contact). Wrong-fit visitors should self-deselect quickly.

## Brand Personality

**Operator-grade · Confident · Quietly technical.**

Voice reads like senior engineers who run real systems, not marketers. Confident without hype. Technical depth surfaces through specificity and restraint, not jargon dumps. The site uses words like "command layer", "orchestration", "operator notified only if needed" — that's the register, and it should hold across every surface.

Emotional goals: the visitor should feel **calm authority** — these people clearly know what they're doing, they're not selling them a dream. No urgency stacking. No exclamation marks on conversions. Trust is built by being specific (named tools, real timelines, transparent pricing), not by being loud.

The brand stands for: *running the unsexy ops layer of a business so the team can focus on higher-leverage work.* Every design decision should reinforce that we're craftspeople, not consultants — we ship working systems, we don't deliver decks.

## Anti-references

The site must never look or read like any of these. These override every other design instinct.

- **Generic AI-agency clichés.** Purple/cyan radial gradients on dark backgrounds, neon cyber grids, glassmorphism cards stacked on robot illustrations, "unleash the power of AI" / "harness the future" copy. The whole template aesthetic that 1000 agency sites already use. *Note: the current hero uses background-clip gradient text and a Spline 3D robot iframe — both flirt with this lane and should be reworked in future iterations rather than extended.*
- **SaaS landing-page template.** The hero-metric template (huge number + tiny supporting label), identical 3-card grids with icon + heading + 2-line description repeated endlessly, gradient text on every heading, scrolling logo clouds, testimonial carousels. The skill's design laws explicitly ban several of these patterns; treat them as failed taste tests, not reusable shortcuts.
- **Marketing-bro funnel energy.** Orange-arrow emojis pointing at CTAs, urgency stacking ("LIMITED SPOTS", "BOOK BEFORE FRIDAY"), countdown timers, "crushing it" / "game-changer" / "no-brainer" copy, founder-bro testimonials. Reads as desperate. We're a working studio, not a course launch.
- **Corporate-consultancy stiffness.** Stock photos of diverse-people-in-suits, navy-and-grey palette, "thought leadership" boilerplate paragraphs, deck-style hero with bullet pyramids, "trusted by industry leaders" without naming any. Reads as agency-of-record but says nothing concrete.

## Design Principles

These are strategic principles, not visual rules. Visual rules go in DESIGN.md.

1. **Show, don't claim.** Every credibility statement is backed by a specific named tool, timeline, deliverable, or proof point. "48h first deployment" beats "fast turnaround". "Built on Perplexity, Claude, Zapier" beats "modern AI stack". If a sentence could appear on any agency site, rewrite it or cut it.
2. **Restraint is the brand.** Quiet is louder than loud here. We're competing against agencies that scream — winning means refusing to. Tight type hierarchy, deliberate color, generous spacing, no decorative noise. Every element earns its place.
3. **Practice what we preach.** We sell agentic systems that "operate like a command layer." The site itself should feel like that: organized, deliberate, every page knowing exactly what it's for. Sloppy or templated UI directly undercuts the pitch.
4. **Operator over funnel.** Conversion paths matter, but they don't dominate the visual register. We don't stack urgency, multiply CTAs, or interrupt with modals. The CTA is always present and always honest. Visitors who aren't ready should be able to leave without being chased.
5. **Specificity wins.** Real numbers, named tools, concrete examples — always. The audience is allergic to abstraction. When in doubt between "AI workflows" and "Lead enrichment that pulls from Perplexity, scores in Claude, drops into HubSpot," choose the second.

## Accessibility & Inclusion

Target: **WCAG 2.1 AA**, with the additional commitments below carried as design-time defaults rather than retrofit checks.

- `prefers-reduced-motion` respected on every animation and scroll-driven effect (already implemented in `base.css` — keep extending this discipline as new motion is added).
- Visible focus rings (`:focus-visible`) on every interactive element. The current 2px primary outline + 3px offset is the floor; do not regress.
- Skip link to `#main` on every page.
- Color-blind safety: the cyan primary + amber accent pair must remain distinguishable across deuteranopia and protanopia. Verify with simulators when adding new color-coded UI states (success/error/warning).
- Hit targets: 44×44px minimum for interactive elements on touch surfaces.
- Body copy at clamp-scale that reaches at least 16px on mobile; never lock font-size below 14px on any surface.
- Forms (audit, contact, automation-box) must announce errors via `aria-live`, not color alone. Labels always visible — placeholder is never the label.
- Iframes (Spline, embedded forms) must carry meaningful `title` attributes and degrade to a static fallback under reduced-motion or noscript.
