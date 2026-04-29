/* ============================================================
   effects.js — Operator-grade motion behaviors
   Scope: per DESIGN.md "Mostly flat + signal glow on hover/focus."
   Three behaviors survived the 2026-04-29 distill:
     1. Scroll progress bar — native CSS first, GSAP fallback
     2. View-transition theme wipe — click-origin clip-path reveal
     3. Hero-only background parallax — capped magnitude
   prefers-reduced-motion is honored at definition, not retrofitted.
   See effects.css for paired CSS and DESIGN.md §4-§5 for rules.
   ============================================================ */
(function () {
  'use strict';

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const $ = (sel, root = document) => root.querySelector(sel);

  function boot() {
    initThemeWipe();
    initScrollProgress();
    initHeroParallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ============================================================
     1. Scroll Progress Bar
     Native CSS scroll-driven animation when supported,
     GSAP ScrollTrigger fallback otherwise.
     ============================================================ */
  function initScrollProgress() {
    const bar = $('#scroll-progress');
    if (!bar) return;

    if (CSS.supports && CSS.supports('animation-timeline', 'scroll()')) {
      bar.style.animationTimeline = 'scroll()';
      return;
    }

    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    gsap.to(bar, {
      scaleX: 1,
      ease: 'none',
      scrollTrigger: {
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        scrub: 0.3,
      },
    });
  }

  /* ============================================================
     2. Theme Transition Wipe
     Click-origin clip-path reveal on theme toggle.
     Duration 220ms with system ease-out (cubic-bezier 0.16,1,0.3,1).
     ============================================================ */
  function initThemeWipe() {
    const toggle = $('[data-theme-toggle]');
    if (!toggle) return;
    if (prefersReducedMotion) return;

    toggle.addEventListener('click', (e) => {
      if (!document.startViewTransition) return;

      const x = e.clientX;
      const y = e.clientY;

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = document.startViewTransition(() => {
        toggle.dispatchEvent(new CustomEvent('theme-wipe-apply'));
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 220,
            easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      }).catch(() => {
        // View transition rejected — noop
      });
    }, { capture: true });
  }

  /* ============================================================
     3. Hero Background Parallax (low magnitude)
     Single survivor of the parallax layer. Section-label parallax
     and header opacity blending dropped during distill.
     ============================================================ */
  function initHeroParallax() {
    if (prefersReducedMotion) return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    const heroBg = $('.hero-bg');
    if (!heroBg) return;

    gsap.to(heroBg, {
      y: '-10%',
      ease: 'none',
      scrollTrigger: {
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        scrub: 0.5,
      },
    });
  }
})();
