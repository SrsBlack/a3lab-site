/* Scroll-animation layer. Vanilla JS, no deps. Survives the x-dc hydration
   replace (~1s after load) by re-scanning on a debounced MutationObserver. */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var revealObserver = null;
  var stepObserver = null;
  var convergeObserver = null;

  function getRoot() {
    return document.querySelector('main') || document.body;
  }

  function ensureProgressBar() {
    if (document.querySelector('.sa-progress')) return;
    var bar = document.createElement('div');
    bar.className = 'sa-progress';
    document.body.appendChild(bar);
  }

  var progressTicking = false;
  function onScrollProgress() {
    if (progressTicking) return;
    progressTicking = true;
    requestAnimationFrame(function () {
      progressTicking = false;
      var bar = document.querySelector('.sa-progress');
      if (!bar) return;
      var scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var p = max > 0 ? scrollTop / max : 0;
      p = Math.max(0, Math.min(1, p));
      bar.style.setProperty('--sa-p', String(p));
    });
  }

  var heroDriftTicking = false;
  function onScrollHeroDrift() {
    if (reduceMotion) return;
    if (heroDriftTicking) return;
    heroDriftTicking = true;
    requestAnimationFrame(function () {
      heroDriftTicking = false;
      var y = window.scrollY || 0;
      if (y >= window.innerHeight) return; // cheap early-return once past the gate
      var drift = document.querySelector('.sa-hero-drift');
      var text = document.querySelector('.sa-hero-text');
      if (drift) drift.style.setProperty('--sa-scroll', String(y));
      if (text) text.style.setProperty('--sa-scroll', String(y));
    });
  }

  function getRevealObserver() {
    if (revealObserver) return revealObserver;
    revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('sa-in');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    return revealObserver;
  }

  function getStepObserver() {
    if (stepObserver) return stepObserver;
    stepObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) entry.target.classList.add('sa-active');
      });
      // no unobserve: earlier steps stay active as you scroll past (progressive activation)
    }, { threshold: 0.6 });
    return stepObserver;
  }

  function getConvergeObserver() {
    if (convergeObserver) return convergeObserver;
    convergeObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('sa-converged');
          var caption = document.querySelector('.sa-converge-caption');
          if (caption) caption.classList.add('sa-in');
          convergeObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    return convergeObserver;
  }

  function isInsideActiveForm(el) {
    var form = el.closest ? el.closest('form') : null;
    if (!form) return false;
    // Defensive guard: skip tagging inside any <form> outright. Simplest approach
    // that satisfies "don't disrupt mid-interaction forms" without tracking
    // per-rescan activeElement state across debounced MutationObserver runs.
    return true;
  }

  function tagReveals(root) {
    var sections = root.querySelectorAll('section');
    for (var s = 0; s < sections.length; s++) {
      var section = sections[s];
      if (s === 0) continue; // never tag the hero (first section) via the generic pass

      var headings = section.querySelectorAll('h2, h3');
      headings.forEach(function (h) {
        if (isInsideActiveForm(h)) return;
        var wrapper = h.parentElement;
        var target = (wrapper && wrapper !== section) ? wrapper : h;
        if (target.closest('.sa-step') || target.closest('#sa-converge')) return;
        if (target.dataset.saTagged) return;
        target.dataset.saTagged = '1';
        target.classList.add('sa-reveal');
        getRevealObserver().observe(target);
      });

      // Grid/flex containers with 3+ substantial children: section > div > div
      var groups = section.querySelectorAll(':scope > div > div');
      groups.forEach(function (group) {
        if (group.dataset.saGroupTagged) return;
        if (isInsideActiveForm(group)) return;
        if (group.id === 'sa-converge') return;
        if (group.classList.contains('sa-step') || group.querySelector('.sa-step')) return;
        var children = Array.prototype.slice.call(group.children);
        var substantial = children.filter(function (c) {
          return c.offsetHeight > 60 && !c.classList.contains('sa-step');
        });
        if (children.length >= 3 && substantial.length >= 3) {
          group.dataset.saGroupTagged = '1';
          children.forEach(function (child, idx) {
            if (child.dataset.saTagged) return;
            child.dataset.saTagged = '1';
            child.classList.add('sa-reveal');
            child.style.setProperty('--sa-i', String(Math.min(idx, 5)));
            getRevealObserver().observe(child);
          });
        }
      });
    }
  }

  function tagFourMoves(root) {
    var headings = root.querySelectorAll('section h2');
    var stepSection = null;
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].textContent.indexOf('Four moves') !== -1) {
        stepSection = headings[i].closest('section');
        break;
      }
    }
    if (!stepSection) return;
    if (stepSection.dataset.saStepsTagged) return;

    var stepWrap = stepSection.querySelector(':scope > div > div[style*="flex-direction:column"]');
    var steps = stepWrap ? Array.prototype.slice.call(stepWrap.children) : [];
    if (steps.length < 4) return;

    stepSection.dataset.saStepsTagged = '1';
    steps.forEach(function (step, idx) {
      step.classList.add('sa-step');
      if (idx === steps.length - 1) step.classList.add('sa-amber');
      getStepObserver().observe(step);
    });
  }

  function tagConverge(root) {
    var el = root.querySelector('#sa-converge');
    if (!el || el.dataset.saTagged) return;
    el.dataset.saTagged = '1';
    getConvergeObserver().observe(el);
  }

  function tagAndObserve() {
    var root = getRoot();

    try { tagFourMoves(root); } catch (e) {}
    try { tagReveals(root); } catch (e) {}
    try { tagConverge(root); } catch (e) {}

    try { ensureProgressBar(); } catch (e) {}
  }

  var mutationTimer = null;
  function scheduleRescan() {
    clearTimeout(mutationTimer);
    mutationTimer = setTimeout(tagAndObserve, 200);
  }

  function init() {
    try { tagAndObserve(); } catch (e) {}

    var mo = new MutationObserver(function () { scheduleRescan(); });
    mo.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('scroll', onScrollProgress, { passive: true });
    onScrollProgress();

    if (!reduceMotion) {
      window.addEventListener('scroll', onScrollHeroDrift, { passive: true });
      onScrollHeroDrift();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
