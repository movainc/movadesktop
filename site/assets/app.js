/* ==========================================================================
   Knoxus documentation — client behaviour.
   No dependencies, no network calls, no storage beyond the theme preference.
   Every enhancement is optional: the site is fully readable with JS disabled.
   ========================================================================== */

(function () {
  'use strict';

  const root = document.body.dataset.root || '';
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* 1 — Theme ------------------------------------------------------------ */

  const THEME_KEY = 'knoxus-theme';

  function setTheme(theme) {
    document.documentElement.dataset.theme = theme;
    try { window.localStorage.setItem(THEME_KEY, theme); } catch (err) { /* private mode */ }
  }

  $$('[data-theme-toggle]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
    });
  });

  /* 2 — Mobile navigation drawer ---------------------------------------- */

  const sidebar = $('#sidebar');
  const navToggle = $('[data-nav-toggle]');

  function closeNav() {
    if (!sidebar) return;
    sidebar.classList.remove('is-open');
    if (navToggle) {
      navToggle.setAttribute('aria-expanded', 'false');
      navToggle.setAttribute('aria-label', 'Show navigation');
    }
  }

  if (sidebar && navToggle) {
    navToggle.addEventListener('click', function () {
      const open = sidebar.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Hide navigation' : 'Show navigation');
    });
    sidebar.addEventListener('click', function (event) {
      if (event.target.closest('a')) closeNav();
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') closeNav();
    });
  }

  /* 3 — Copy buttons ----------------------------------------------------- */

  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const code = btn.closest('.code') && btn.closest('.code').querySelector('code');
      if (!code) return;
      const done = function (label) {
        btn.textContent = label;
        btn.dataset.copied = 'true';
        window.setTimeout(function () {
          btn.textContent = 'Copy';
          btn.dataset.copied = 'false';
        }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code.textContent).then(function () {
          done('Copied');
        }, function () {
          done('Select the text');
        });
      } else {
        done('Select the text');
      }
    });
  });

  /* 4 — Reading progress ------------------------------------------------- */

  const bar = $('#progress-bar');
  if (bar) {
    let frame = 0;
    const update = function () {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const ratio = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      bar.style.width = (ratio * 100).toFixed(2) + '%';
    };
    window.addEventListener('scroll', function () {
      if (!frame) frame = window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  /* 5 — Table of contents scrollspy -------------------------------------- */

  const tocLinks = $$('.toc-list a');
  if (tocLinks.length && 'IntersectionObserver' in window) {
    const byId = {};
    tocLinks.forEach(function (link) {
      byId[link.getAttribute('href').slice(1)] = link;
    });
    const heads = Object.keys(byId)
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    const visible = new Set();
    const observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) visible.add(entry.target.id);
        else visible.delete(entry.target.id);
      });
      let current = null;
      heads.forEach(function (head) {
        if (!current && visible.has(head.id)) current = head.id;
      });
      tocLinks.forEach(function (link) {
        const id = link.getAttribute('href').slice(1);
        if (current && id === current) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }, { rootMargin: '-72px 0px -70% 0px', threshold: 0 });

    heads.forEach(function (head) { observer.observe(head); });
  }

  /* 6 — Search ----------------------------------------------------------- */

  const dialog = $('#search');
  const searchInput = $('#search-input');
  const resultsList = $('#search-results');
  const searchStatus = $('#search-status');
  const index = Array.isArray(window.KNOXUS_INDEX) ? window.KNOXUS_INDEX : [];
  const normalise = function (s) { return String(s).toLowerCase(); };

  function score(entry, terms, raw) {
    const haystack = normalise(entry.t + ' ' + entry.h + ' ' + entry.x);
    const head = normalise(entry.h);
    let total = 0;
    for (let i = 0; i < terms.length; i += 1) {
      if (haystack.indexOf(terms[i]) === -1) return -1;
      total += head.indexOf(terms[i]) !== -1 ? 6 : 2;
      if (head.indexOf(terms[i]) === 0) total += 4;
    }
    if (head.indexOf(normalise(raw)) !== -1) total += 3;
    return total;
  }

  function snippet(entry, term) {
    const at = normalise(entry.x).indexOf(term);
    if (at === -1) return null;
    const start = Math.max(0, at - 60);
    const end = Math.min(entry.x.length, at + term.length + 90);
    return {
      before: (start > 0 ? '…' : '') + entry.x.slice(start, at),
      hit: entry.x.slice(at, at + term.length),
      after: entry.x.slice(at + term.length, end) + (end < entry.x.length ? '…' : ''),
    };
  }

  function renderResults(query) {
    if (!resultsList) return;
    const terms = normalise(query).split(/\s+/).filter(function (t) { return t.length > 1; });
    resultsList.textContent = '';
    if (!terms.length) {
      if (searchStatus) searchStatus.textContent = 'Type to search ' + index.length + ' sections.';
      return;
    }
    const matches = index
      .map(function (entry) { return { entry: entry, value: score(entry, terms, query) }; })
      .filter(function (hit) { return hit.value >= 0; })
      .sort(function (a, b) { return b.value - a.value; })
      .slice(0, 18);

    if (searchStatus) {
      searchStatus.textContent = matches.length
        ? matches.length + ' result' + (matches.length === 1 ? '' : 's') + ' for “' + query + '”'
        : 'No results for “' + query + '”';
    }

    matches.forEach(function (hit) {
      const entry = hit.entry;
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.className = 'search-result';
      a.href = root + entry.p + (entry.a ? '#' + entry.a : '');

      const title = document.createElement('span');
      title.className = 'sr-title';
      title.textContent = entry.h;
      const page = document.createElement('span');
      page.className = 'sr-page';
      page.textContent = entry.t;
      a.appendChild(title);
      a.appendChild(page);

      const part = snippet(entry, terms[0]);
      if (part) {
        const snip = document.createElement('span');
        snip.className = 'sr-snippet';
        snip.appendChild(document.createTextNode(part.before));
        const mark = document.createElement('mark');
        mark.textContent = part.hit;
        snip.appendChild(mark);
        snip.appendChild(document.createTextNode(part.after));
        a.appendChild(snip);
      }

      li.appendChild(a);
      resultsList.appendChild(li);
    });
  }

  function openSearch() {
    if (!dialog) return;
    if (typeof dialog.showModal === 'function') {
      if (!dialog.open) dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }
    renderResults('');
  }

  function closeSearch() {
    if (!dialog) return;
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    else dialog.removeAttribute('open');
  }

  $$('[data-search-open]').forEach(function (btn) { btn.addEventListener('click', openSearch); });
  $$('[data-search-close]').forEach(function (btn) { btn.addEventListener('click', closeSearch); });

  if (searchInput) {
    let timer = 0;
    searchInput.addEventListener('input', function () {
      window.clearTimeout(timer);
      timer = window.setTimeout(function () { renderResults(searchInput.value); }, 110);
    });
  }

  if (dialog) {
    dialog.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
      const links = $$('.search-result', dialog);
      if (!links.length) return;
      event.preventDefault();
      const from = links.indexOf(document.activeElement);
      const next = event.key === 'ArrowDown'
        ? (from + 1) % links.length
        : (from - 1 + links.length) % links.length;
      links[next].focus();
    });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) closeSearch();
    });
  }

  /* 7 — Keyboard shortcuts ------------------------------------------------ */

  document.addEventListener('keydown', function (event) {
    const el = event.target;
    const tag = (el && el.tagName) || '';
    const typing = tag === 'INPUT' || tag === 'TEXTAREA' || (el && el.isContentEditable);
    if (typing) return;
    if ((event.key === 'k' || event.key === 'K') && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      openSearch();
      return;
    }
    if (event.key === '/') {
      event.preventDefault();
      openSearch();
    }
  });

  /* 8 — Anchor targets take focus, for keyboard and screen-reader users ---- */

  document.addEventListener('click', function (event) {
    const link = event.target && event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!link) return;
    const target = document.getElementById(link.getAttribute('href').slice(1));
    if (!target) return;
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  });

  /* 9 — Respect reduced-motion for programmatic scrolling ------------------ */

  if (reduceMotion) document.documentElement.style.scrollBehavior = 'auto';

  /* 10 — Initial search status -------------------------------------------- */

  if (searchStatus) {
    searchStatus.textContent = index.length
      ? 'Type to search ' + index.length + ' sections.'
      : 'Search index unavailable.';
  }
})();
