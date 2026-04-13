/* ============================================================
   effects.js — Futuristic UI effects for A3Lab site
   Dependencies: GSAP 3.12.5 + ScrollTrigger (loaded via CDN)
   ============================================================ */
(function () {
  'use strict';

  /* ----------------------------------------------------------
     Helpers & Feature Detection
     ---------------------------------------------------------- */
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const isTouchDevice =
    'ontouchstart' in window || navigator.maxTouchPoints > 0;

  /** Safely query; returns [] if nothing found. */
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const $ = (sel, root = document) => root.querySelector(sel);

  /** Linear interpolation. */
  const lerp = (a, b, t) => a + (b - a) * t;

  /** Random float in [min, max). */
  const rand = (min, max) => Math.random() * (max - min) + min;

  /** Random integer in [min, max]. */
  const randInt = (min, max) => Math.floor(rand(min, max + 1));

  /* ----------------------------------------------------------
     Boot — wait for DOM
     ---------------------------------------------------------- */
  function boot() {
    initParticleCanvas();
    initTextScrambleSections();
    initMagneticButtons();
    initTypingTerminal();
    initCardTilt();
    initCounterScramble();
    initCustomCursor();
    initThemeWipe();
    initParallax();
    initScrollProgress();
    initFloatingOrbs();
    initRevealMasks();
    initGlitchText();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  /* ============================================================
     1. Particle Canvas Background (Hero)
     ============================================================ */
  function initParticleCanvas() {
    const canvas = $('#particle-canvas');
    if (!canvas) return;

    const hero = $('.hero');
    if (!hero) return;

    const ctx = canvas.getContext('2d');
    const PARTICLE_COUNT = randInt(80, 100);
    const CONNECTION_DIST = 120;
    const MOUSE_RADIUS = 100;

    let width, height;
    let mouseX = -9999;
    let mouseY = -9999;
    let particles = [];

    function resize() {
      width = hero.offsetWidth;
      height = hero.offsetHeight;
      canvas.width = width;
      canvas.height = height;
    }

    function createParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x: rand(0, width),
          y: rand(0, height),
          vx: rand(-0.3, 0.3),
          vy: rand(-0.3, 0.3),
          size: rand(1, 3),
          opacity: rand(0.2, 0.6),
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Draw particle
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(34, 211, 238, ${p.opacity})`;
        ctx.fill();

        // Draw connections
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < CONNECTION_DIST) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = `rgba(34, 211, 238, ${0.08 * (1 - dist / CONNECTION_DIST)})`;
            ctx.stroke();
          }
        }
      }
    }

    function update() {
      for (const p of particles) {
        // Mouse repulsion
        const dx = p.x - mouseX;
        const dy = p.y - mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < MOUSE_RADIUS && dist > 0) {
          const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS;
          p.vx += (dx / dist) * force * 0.15;
          p.vy += (dy / dist) * force * 0.15;
        }

        // Dampen velocity
        p.vx *= 0.98;
        p.vy *= 0.98;

        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
      }
    }

    function loop() {
      update();
      draw();
      requestAnimationFrame(loop);
    }

    resize();
    createParticles();

    if (prefersReducedMotion) {
      // Static draw only
      draw();
    } else {
      loop();
    }

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    });

    hero.addEventListener('mouseleave', () => {
      mouseX = -9999;
      mouseY = -9999;
    });

    window.addEventListener('resize', () => {
      resize();
      // Re-scatter particles that ended up out-of-bounds
      for (const p of particles) {
        if (p.x > width) p.x = rand(0, width);
        if (p.y > height) p.y = rand(0, height);
      }
      if (prefersReducedMotion) draw();
    });
  }

  /* ============================================================
     2. Text Scramble / Decode Effect
     ============================================================ */
  class TextScramble {
    constructor(el) {
      this.el = el;
      this.chars = '!<>-_\\/[]{}—=+*^?#@$';
      this.originalText = el.textContent;
      this.queue = [];
      this.frame = 0;
      this.frameRequest = null;
      this.resolve = null;
    }

    setText(newText) {
      const length = Math.max(this.originalText.length, newText.length);
      this.queue = [];

      for (let i = 0; i < length; i++) {
        const from = this.originalText[i] || '';
        const to = newText[i] || '';
        const start = Math.floor(Math.random() * 20);
        const end = start + Math.floor(Math.random() * 20) + 10;
        this.queue.push({ from, to, start, end, char: '' });
      }

      cancelAnimationFrame(this.frameRequest);
      this.frame = 0;

      return new Promise((resolve) => {
        this.resolve = resolve;
        this._update();
      });
    }

    _update() {
      let output = '';
      let complete = 0;

      for (let i = 0; i < this.queue.length; i++) {
        const { from, to, start, end } = this.queue[i];
        let { char } = this.queue[i];

        if (this.frame >= end) {
          complete++;
          output += to;
        } else if (this.frame >= start) {
          if (!char || Math.random() < 0.28) {
            char = this.chars[Math.floor(Math.random() * this.chars.length)];
            this.queue[i].char = char;
          }
          output += `<span class="scramble-char">${char}</span>`;
        } else {
          output += from;
        }
      }

      this.el.innerHTML = output;
      if (complete === this.queue.length) {
        if (this.resolve) this.resolve();
      } else {
        this.frameRequest = requestAnimationFrame(() => this._update());
        this.frame++;
      }
    }
  }

  function initTextScrambleSections() {
    if (prefersReducedMotion) return;

    // Hero h1 scramble on load
    const heroH1 = $('h1');
    if (heroH1) {
      const scrambler = new TextScramble(heroH1);
      const original = heroH1.textContent;
      setTimeout(() => scrambler.setText(original), 500);
    }

    // Section titles on scroll
    const titles = $$('.section-title');
    if (!titles.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target;
            if (el.dataset.scrambled) continue;
            el.dataset.scrambled = '1';
            const scrambler = new TextScramble(el);
            scrambler.setText(scrambler.originalText);
            observer.unobserve(el);
          }
        }
      },
      { threshold: 0.3 }
    );

    for (const t of titles) observer.observe(t);
  }

  /* ============================================================
     3. Magnetic Buttons
     ============================================================ */
  function initMagneticButtons() {
    if (isTouchDevice) return;

    const buttons = $$('.btn-primary, .btn-outline');
    const MAX_OFFSET = 8;
    const PULL_RADIUS = 40;

    for (const btn of buttons) {
      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < PULL_RADIUS) {
          const pull = 1 - dist / PULL_RADIUS;
          const tx = dx * pull * (MAX_OFFSET / PULL_RADIUS);
          const ty = dy * pull * (MAX_OFFSET / PULL_RADIUS);
          btn.style.transform = `translate(${tx}px, ${ty}px)`;
          btn.style.transition = 'transform 0.15s ease-out';
        }
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
        btn.style.transition = 'transform 0.35s ease-out';
      });
    }
  }

  /* ============================================================
     4. Typing Terminal Animation
     ============================================================ */
  function initTypingTerminal() {
    const items = $$('.hero-command-item');
    if (!items.length) return;

    // Collect text spans (second child span, not .hero-command-step)
    const lines = [];
    for (const item of items) {
      const spans = item.querySelectorAll('span');
      const textSpan = Array.from(spans).find(
        (s) => !s.classList.contains('hero-command-step')
      );
      if (textSpan) {
        lines.push({ span: textSpan, text: textSpan.textContent });
      }
    }

    if (!lines.length) return;

    if (prefersReducedMotion) {
      // Show everything immediately
      return;
    }

    // Hide all text initially
    for (const line of lines) {
      line.span.textContent = '';
    }

    const CURSOR = '|';
    let cursorInterval = null;

    function startCursorBlink(span) {
      let visible = true;
      clearInterval(cursorInterval);
      cursorInterval = setInterval(() => {
        const base = span.textContent.replace(/\|$/, '');
        span.textContent = base + (visible ? CURSOR : '');
        visible = !visible;
      }, 530);
    }

    function stopCursor(span) {
      clearInterval(cursorInterval);
      span.textContent = span.textContent.replace(/\|$/, '');
    }

    async function typeLine(lineObj) {
      const { span, text } = lineObj;
      span.textContent = '';
      startCursorBlink(span);

      for (let i = 0; i < text.length; i++) {
        await new Promise((r) => setTimeout(r, randInt(40, 60)));
        const current = text.slice(0, i + 1);
        span.textContent = current + CURSOR;
      }

      stopCursor(span);
      span.textContent = text;
    }

    async function run() {
      for (let i = 0; i < lines.length; i++) {
        await typeLine(lines[i]);
        if (i < lines.length - 1) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }
    }

    setTimeout(run, 1000);
  }

  /* ============================================================
     5. Card 3D Tilt on Hover
     ============================================================ */
  function initCardTilt() {
    if (isTouchDevice) return;

    const cards = $$(
      '.service-card, .pricing-card, .story-card, .testimonial-card'
    );
    const MAX_DEG = 6;

    for (const card of cards) {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const percentX = dx / (rect.width / 2);
        const percentY = dy / (rect.height / 2);

        const rotateX = -percentY * MAX_DEG;
        const rotateY = percentX * MAX_DEG;

        card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        card.style.transition = 'transform 0.1s ease-out';

        // Set custom properties for CSS light-reflection ::after
        card.style.setProperty('--tilt-x', `${percentX}`);
        card.style.setProperty('--tilt-y', `${percentY}`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
        card.style.transition = 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)';
        card.style.setProperty('--tilt-x', '0');
        card.style.setProperty('--tilt-y', '0');
      });
    }
  }

  /* ============================================================
     6. Counter Scramble (Enhanced Stats)
     ============================================================ */
  function initCounterScramble() {
    const stats = $$('.stat-value');
    if (!stats.length) return;

    const scrambleChars = '0123456789!@#$%&*?';
    const DURATION = 500; // ms
    const FRAME_INTERVAL = 40;

    function scrambleStat(el) {
      if (el.classList.contains('scramble-done')) return;
      el.classList.add('scramble-done');

      const finalText = el.textContent;
      const totalFrames = Math.floor(DURATION / FRAME_INTERVAL);
      let frame = 0;

      const interval = setInterval(() => {
        frame++;
        const resolvedCount = Math.floor(
          (frame / totalFrames) * finalText.length
        );
        let display = '';

        for (let i = 0; i < finalText.length; i++) {
          if (i < resolvedCount) {
            display += finalText[i];
          } else if (/\s/.test(finalText[i])) {
            display += finalText[i]; // Keep whitespace
          } else {
            display +=
              scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
          }
        }

        el.textContent = display;

        if (frame >= totalFrames) {
          clearInterval(interval);
          el.textContent = finalText;
        }
      }, FRAME_INTERVAL);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            scrambleStat(entry.target);
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.5 }
    );

    for (const el of stats) observer.observe(el);
  }

  /* ============================================================
     7. Custom Cursor
     ============================================================ */
  function initCustomCursor() {
    if (isTouchDevice) return;

    const dot = document.createElement('div');
    dot.className = 'custom-cursor-dot';
    const ring = document.createElement('div');
    ring.className = 'custom-cursor-ring';
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    document.body.classList.add('has-custom-cursor');

    // Exclude chatbot widget from cursor: none
    const chatbotWidget = $('.chatbot-widget');
    if (chatbotWidget) {
      chatbotWidget.style.cursor = 'auto';
    }

    let mouseX = -100;
    let mouseY = -100;
    let ringX = -100;
    let ringY = -100;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    const HOVERABLE = 'a, button, .service-card, .pricing-card';

    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(HOVERABLE)) {
        dot.classList.add('hovering');
        ring.classList.add('hovering');
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(HOVERABLE)) {
        dot.classList.remove('hovering');
        ring.classList.remove('hovering');
      }
    });

    // Hide cursor when it leaves the viewport
    document.addEventListener('mouseleave', () => {
      dot.style.opacity = '0';
      ring.style.opacity = '0';
    });

    document.addEventListener('mouseenter', () => {
      dot.style.opacity = '1';
      ring.style.opacity = '1';
    });

    function animateCursor() {
      dot.style.transform = `translate(${mouseX}px, ${mouseY}px)`;
      ringX = lerp(ringX, mouseX, 0.15);
      ringY = lerp(ringY, mouseY, 0.15);
      ring.style.transform = `translate(${ringX}px, ${ringY}px)`;
      requestAnimationFrame(animateCursor);
    }

    animateCursor();
  }

  /* ============================================================
     8. Theme Transition Wipe
     ============================================================ */
  function initThemeWipe() {
    const toggle = $('[data-theme-toggle]');
    if (!toggle) return;

    toggle.addEventListener('click', (e) => {
      if (!document.startViewTransition) return; // Fallback: instant toggle handled elsewhere

      const x = e.clientX;
      const y = e.clientY;

      // Calculate the radius needed to cover the entire viewport
      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      const transition = document.startViewTransition(() => {
        // The existing toggle handler flips the theme class/attribute.
        // startViewTransition captures the old state automatically.
        // We dispatch a synthetic event so the real handler fires inside the callback.
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
            duration: 500,
            easing: 'ease-in-out',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      }).catch(() => {
        // View transition rejected — noop
      });
    }, { capture: true }); // Capture phase so we intercept before the real handler
  }

  /* ============================================================
     9. Parallax Depth Layers (GSAP ScrollTrigger)
     ============================================================ */
  function initParallax() {
    if (prefersReducedMotion) return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    // Hero background parallax
    const heroBg = $('.hero-bg');
    if (heroBg) {
      gsap.to(heroBg, {
        y: '-15%',
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }

    // Section label subtle parallax
    const labels = $$('.section-label');
    for (const label of labels) {
      gsap.to(label, {
        y: '8%',
        ease: 'none',
        scrollTrigger: {
          trigger: label,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      });
    }

    // Header opacity on scroll
    const header = $('.site-header');
    if (header) {
      ScrollTrigger.create({
        trigger: '.hero',
        start: 'top top',
        end: 'bottom top',
        onUpdate: (self) => {
          const progress = self.progress;
          // Blend from 0 to 0.95 opacity on the header backdrop
          header.style.setProperty(
            '--header-bg-opacity',
            `${0.6 + progress * 0.35}`
          );
        },
      });
    }
  }

  /* ============================================================
     10. Scroll Progress Bar
     ============================================================ */
  function initScrollProgress() {
    const bar = $('#scroll-progress');
    if (!bar) return;

    // Try native CSS scroll-driven animation first
    if (CSS.supports && CSS.supports('animation-timeline', 'scroll()')) {
      bar.style.animationTimeline = 'scroll()';
      return; // CSS handles it
    }

    // GSAP fallback
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
     11. Floating Orbs Init
     ============================================================ */
  function initFloatingOrbs() {
    const orbs = $$('.floating-orb');
    for (const orb of orbs) {
      orb.style.animationDelay = `${rand(-5, 0).toFixed(2)}s`;
      orb.style.animationDuration = `${rand(15, 25).toFixed(2)}s`;
    }
  }

  /* ============================================================
     12. Section Reveal Masks
     ============================================================ */
  function initRevealMasks() {
    if (prefersReducedMotion) return;

    const els = $$('.reveal-mask');
    if (!els.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );

    for (const el of els) observer.observe(el);
  }

  /* ============================================================
     13. Glitch Text Setup
     ============================================================ */
  function initGlitchText() {
    const els = $$('.glitch-hover');
    for (const el of els) {
      el.setAttribute('data-text', el.textContent);
    }
  }
})();
