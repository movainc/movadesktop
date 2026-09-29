#!/usr/bin/env node
/**
 * Knoxus documentation site generator.
 *
 *   node site/build.mjs
 *
 * Reads markdown from /docs and emits a static site into /site/dist.
 *
 * Design constraints (deliberate):
 *   - Zero runtime and build dependencies. Node's standard library only.
 *   - No network at build time or in the browser. No fonts, analytics or CDNs.
 *     The output must work from file:// as well as from a web server.
 *   - Escaping happens before inline formatting, so document content can never
 *     inject markup.
 */

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '..');
const SRC = join(ROOT, 'docs');
const OUT = join(HERE, 'dist');

const SITE = {
  name: 'Knoxus',
  tagline: 'Engineering documentation',
  status: 'planning · pre-code',
  repo: 'https://github.com/movainc/movadesktop',
};

/**
 * The page manifest. Order here defines the sidebar order, the prev/next chain
 * and the landing-page card order. `summary` is shown on cards; `icon` maps to a
 * symbol in the inline SVG sprite.
 */
const PAGES = [
  { src: '../HANDOFF.md', out: 'handoff.html', group: 'Overview', title: 'Handoff — read first',
    icon: 'flag', summary: 'Where the project stands, what is decided and blocked, and the Phase 0 checklist for picking it up.' },
  { src: 'README.md', out: 'docs/index.html', group: 'Overview', title: 'Documentation index',
    icon: 'home', summary: 'How the document set fits together, standing assumptions and the non-negotiable constraints.' },
  { src: 'PLAN.md', out: 'docs/PLAN.html', group: 'Overview', title: 'Product & delivery plan',
    icon: 'map', summary: 'Scope, the three load-bearing findings, subsystem specs, roadmap, kill criteria and open decisions.' },
  { src: 'architecture/STACK.md', out: 'docs/architecture/STACK.html', group: 'Architecture', title: 'Technology stack',
    icon: 'layers', summary: 'Web-first SPA with a Rust core: crates, workspace layout, performance budgets and CI gates.' },
  { src: 'adr/README.md', out: 'docs/adr/index.html', group: 'Decisions', title: 'ADR index',
    icon: 'list', summary: 'Every architecture decision record, its status, and the decisions deliberately deferred.' },
  { src: 'adr/0000-adr-template.md', out: 'docs/adr/0000-adr-template.html', group: 'Decisions', title: 'ADR-0000 Template', icon: 'doc', adr: true },
  { src: 'adr/0001-record-architecture-decisions.md', out: 'docs/adr/0001-record-architecture-decisions.html', group: 'Decisions', title: 'ADR-0001 Record decisions', icon: 'doc', adr: true },
  { src: 'adr/0002-web-first-spa-rust-backend.md', out: 'docs/adr/0002-web-first-spa-rust-backend.html', group: 'Decisions', title: 'ADR-0002 Web-first + Rust', icon: 'doc', adr: true },
  { src: 'adr/0003-modular-monolith-cargo-workspace.md', out: 'docs/adr/0003-modular-monolith-cargo-workspace.html', group: 'Decisions', title: 'ADR-0003 Modular monolith', icon: 'doc', adr: true },
  { src: 'adr/0004-school-issued-identities-multi-tenant.md', out: 'docs/adr/0004-school-issued-identities-multi-tenant.html', group: 'Decisions', title: 'ADR-0004 School identities', icon: 'doc', adr: true },
  { src: 'adr/0005-chat-privacy-tiering.md', out: 'docs/adr/0005-chat-privacy-tiering.html', group: 'Decisions', title: 'ADR-0005 Chat privacy tiering', icon: 'doc', adr: true },
  { src: 'adr/0006-curated-finite-feed.md', out: 'docs/adr/0006-curated-finite-feed.html', group: 'Decisions', title: 'ADR-0006 Curated finite feed', icon: 'doc', adr: true },
  { src: 'adr/0007-credits-append-only-ledger.md', out: 'docs/adr/0007-credits-append-only-ledger.html', group: 'Decisions', title: 'ADR-0007 Credits ledger', icon: 'doc', adr: true },
  { src: 'adr/0008-ai-gateway-prompt-packs.md', out: 'docs/adr/0008-ai-gateway-prompt-packs.html', group: 'Decisions', title: 'ADR-0008 AI gateway', icon: 'doc', adr: true },
  { src: 'adr/0009-compute-hosting-gated-last.md', out: 'docs/adr/0009-compute-hosting-gated-last.html', group: 'Decisions', title: 'ADR-0009 Compute gated last', icon: 'doc', adr: true },
  { src: 'adr/0010-tauri-desktop-shell.md', out: 'docs/adr/0010-tauri-desktop-shell.html', group: 'Decisions', title: 'ADR-0010 Tauri desktop shell', icon: 'doc', adr: true },
  { src: 'threat-model/THREAT-MODEL.md', out: 'docs/threat-model/THREAT-MODEL.html', group: 'Safety', title: 'Threat model',
    icon: 'shield', summary: 'Assets, actors, trust boundaries, STRIDE, 18 abuse cases, the red-team suite and residual risk.' },
  { src: 'compliance/DPIA.md', out: 'docs/compliance/DPIA.html', group: 'Safety', title: 'DPIA skeleton',
    icon: 'clipboard', summary: 'Data map, retention, access control and the ten questions engineering is sending to counsel.' },
  { src: 'economics/CREDITS-MODEL.md', out: 'docs/economics/CREDITS-MODEL.html', group: 'Safety', title: 'Credits economy',
    icon: 'coins', summary: 'Rates, worked examples, faucets and sinks, real-dollar exposure and anti-abuse controls.' },
];

const GROUP_ORDER = ['Overview', 'Architecture', 'Decisions', 'Safety'];

// ---------------------------------------------------------------- utilities

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/** Source path as a human reads it — HANDOFF.md lives outside docs/. */
const sourceLabel = (src) => (src.startsWith('../') ? src.slice(3) : `docs/${src}`);

/** GitHub-compatible-enough heading slug. */
const slug = (text) =>
  text.toLowerCase()
    .replace(/`/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');

// ------------------------------------------------------- inline formatting

/** Escaped text in, inline HTML out. Code spans are extracted first so that
 *  markdown syntax inside them is never interpreted. */
function inline(text) {
  const codes = [];
  let s = escapeHtml(text);
  s = s.replace(/`([^`]+)`/g, (_, code) => {
    codes.push(code);
    return `\u0000${codes.length - 1}\u0000`;
  });
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (_, label, href, title) => {
    const url = rewriteHref(href);
    const external = /^https?:/i.test(url);
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : '';
    const tip = title ? ` title="${title}"` : '';
    const glyph = external ? '<span class="ext" aria-hidden="true">↗</span>' : '';
    return `<a href="${url}"${tip}${attrs}>${label}${glyph}</a>`;
  });
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1<em>$2</em>');
  s = s.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[Number(i)]}</code>`);
  return s;
}

/** Markdown links become site links; everything else is left alone. */
function rewriteHref(href) {
  if (/^(https?:|mailto:|#)/i.test(href)) return href;
  if (href === 'adr/') return 'adr/index.html';
  if (href === '../' || href === './') return '../index.html';
  if (href.endsWith('/')) return `${href}index.html`;
  return href.replace(/\.md($|#)/, '.html$1');
}

// ------------------------------------------------------------ block parsing

const RE = {
  fence: /^```/,
  heading: /^(#{1,4})\s+(.*)$/,
  hr: /^(-{3,}|\*{3,}|_{3,})$/,
  task: /^(\s*)[-*+]\s+\[([ xX])\]\s+(.*)$/,
  ul: /^(\s*)[-*+]\s+(.*)$/,
  ol: /^(\s*)\d+[.)]\s+(.*)$/,
  bq: /^\s*>\s?(.*)$/,
  tableRow: /^\s*\|/,
  sepRow: /^\s*\|[\s:|-]+\|\s*$/,
  meta: /^- \*\*([^*]+):\*\*\s*(.*)$/,
};

const indentOf = (line) => (line.match(/^(\s*)/) || ['', ''])[1].length;

const startsBlock = (line) =>
  RE.fence.test(line) || RE.heading.test(line) || RE.hr.test(line) ||
  RE.task.test(line) || RE.ul.test(line) || RE.ol.test(line) ||
  RE.bq.test(line) || RE.tableRow.test(line);

/** Split a table row on pipes, ignoring pipes inside `code spans` and `\|`. */
function splitRow(line) {
  const body = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let buf = '';
  let inCode = false;
  for (let i = 0; i < body.length; i += 1) {
    const ch = body[i];
    if (ch === '\\' && body[i + 1] === '|') { buf += '|'; i += 1; continue; }
    if (ch === '`') inCode = !inCode;
    if (ch === '|' && !inCode) { cells.push(buf); buf = ''; continue; }
    buf += ch;
  }
  cells.push(buf);
  return cells.map((c) => c.trim());
}

function alignmentsFrom(sepLine) {
  return splitRow(sepLine).map((cell) => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    return 'left';
  });
}

function renderTable(headerLine, sepLine, bodyLines) {
  const align = alignmentsFrom(sepLine);
  const cls = (i) => (align[i] && align[i] !== 'left' ? ` class="ta-${align[i]}"` : '');
  const head = splitRow(headerLine)
    .map((c, i) => `<th scope="col"${cls(i)}>${inline(c)}</th>`).join('');
  const rows = bodyLines.map((row) => {
    const cells = splitRow(row).map((c, i) => `<td${cls(i)}>${inline(c)}</td>`).join('');
    return `<tr>${cells}</tr>`;
  }).join('\n');
  return `<div class="table-wrap" role="region" aria-label="Table, scrollable" tabindex="0">
<table>
<thead><tr>${head}</tr></thead>
<tbody>
${rows}
</tbody>
</table>
</div>`;
}

/** Lists with continuation lines and one level of nesting. Returns {html,next}. */
function renderList(lines, start, ordered, ctx) {
  const marker = ordered ? RE.ol : RE.ul;
  const baseIndent = indentOf(lines[start]);
  const items = [];
  let i = start;

  while (i < lines.length) {
    const m = lines[i].match(marker);
    if (!m || indentOf(lines[i]) !== baseIndent) break;
    let text = m[2];
    let nested = '';
    i += 1;

    while (i < lines.length) {
      const line = lines[i];
      if (line.trim() === '') break;
      const ind = indentOf(line);
      if (ind < baseIndent) break;
      if (ind === baseIndent && marker.test(line)) break;
      const isSub = RE.ul.test(line) || RE.ol.test(line) || RE.task.test(line);
      if (isSub && ind > baseIndent) {
        const block = [];
        while (i < lines.length && lines[i].trim() !== '' && indentOf(lines[i]) >= ind) {
          block.push(lines[i].slice(ind));
          i += 1;
        }
        nested += renderBlocks(block, ctx).html;
        continue;
      }
      if (ind > baseIndent) { text += ` ${line.trim()}`; i += 1; continue; }
      break;
    }
    items.push(`<li>${inline(text)}${nested}</li>`);
  }
  return { html: `<${ordered ? 'ol' : 'ul'}>\n${items.join('\n')}\n</${ordered ? 'ol' : 'ul'}>`, next: i };
}

/** `- [x]` / `- [ ]` checklists, used by the docs status board. */
function renderTasks(lines, start) {
  const baseIndent = indentOf(lines[start]);
  const rows = [];
  let i = start;
  while (i < lines.length) {
    const m = lines[i].match(RE.task);
    if (!m || indentOf(lines[i]) !== baseIndent) break;
    let text = m[3];
    const done = m[2].toLowerCase() === 'x';
    i += 1;
    while (i < lines.length && lines[i].trim() !== '' &&
           indentOf(lines[i]) > baseIndent && !RE.task.test(lines[i])) {
      text += ` ${lines[i].trim()}`;
      i += 1;
    }
    rows.push({ text, done });
  }
  const html = rows.map(({ text, done }) =>
    `<li class="task${done ? ' is-done' : ''}">` +
    `<span class="box" role="img" aria-label="${done ? 'done' : 'not done'}">${done ? '✓' : ''}</span>` +
    `<span>${inline(text)}</span></li>`).join('\n');
  return { html: `<ul class="tasks">\n${html}\n</ul>`, next: i };
}

/** Blockquotes recurse through the block renderer, so quoted tables work. */
function renderQuote(lines, start, ctx) {
  const inner = [];
  let i = start;
  while (i < lines.length) {
    const m = lines[i].match(RE.bq);
    if (m) { inner.push(m[1]); i += 1; continue; }
    if (lines[i].trim() === '' && lines[i + 1] && RE.bq.test(lines[i + 1])) {
      inner.push('');
      i += 1;
      continue;
    }
    break;
  }
  const { html } = renderBlocks(inner, ctx);
  return { html: `<blockquote>\n${html}\n</blockquote>`, next: i };
}

/** The block-level renderer. Recursive via renderQuote/renderList. */
function renderBlocks(lines, ctx) {
  const out = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i += 1; continue; }

    if (RE.fence.test(line)) {
      const lang = line.replace(/^```/, '').trim();
      const code = [];
      i += 1;
      while (i < lines.length && !RE.fence.test(lines[i])) { code.push(lines[i]); i += 1; }
      i += 1;
      const cls = lang ? ` class="language-${escapeHtml(lang)}"` : '';
      out.push(
        `<div class="code"><div class="code-head"><span class="code-lang">${escapeHtml(lang || 'text')}</span>` +
        `<button class="copy" type="button" data-copy>Copy</button></div>` +
        `<pre tabindex="0"><code${cls}>${escapeHtml(code.join('\n'))}</code></pre></div>`);
      continue;
    }

    const h = line.match(RE.heading);
    if (h) {
      const level = h[1].length;
      const id = slug(h[2]);
      if (level > 1) ctx.toc.push({ level, text: h[2].replace(/`/g, ''), id });
      const anchor = level > 1
        ? `<a class="anchor" href="#${id}" aria-label="Link to this section"><span aria-hidden="true">#</span></a>`
        : '';
      out.push(`<h${level} id="${id}">${inline(h[2])}${anchor}</h${level}>`);
      i += 1;
      continue;
    }

    if (RE.hr.test(line)) { out.push('<hr>'); i += 1; continue; }

    if (RE.tableRow.test(line) && lines[i + 1] && RE.sepRow.test(lines[i + 1])) {
      const body = [];
      let j = i + 2;
      while (j < lines.length && RE.tableRow.test(lines[j])) { body.push(lines[j]); j += 1; }
      out.push(renderTable(line, lines[i + 1], body));
      i = j;
      continue;
    }

    if (RE.task.test(line)) { const r = renderTasks(lines, i); out.push(r.html); i = r.next; continue; }
    if (RE.ul.test(line)) { const r = renderList(lines, i, false, ctx); out.push(r.html); i = r.next; continue; }
    if (RE.ol.test(line)) { const r = renderList(lines, i, true, ctx); out.push(r.html); i = r.next; continue; }
    if (RE.bq.test(line)) { const r = renderQuote(lines, i, ctx); out.push(r.html); i = r.next; continue; }

    const para = [];
    while (i < lines.length && lines[i].trim() !== '' && !startsBlock(lines[i])) {
      para.push(lines[i].trim());
      i += 1;
    }
    if (para.length) out.push(`<p>${inline(para.join(' '))}</p>`);
    else i += 1;
  }

  return { html: out.join('\n'), toc: ctx.toc };
}

/** ADR-style `- **Status:** …` header lines become a meta card, not prose. */
function renderMeta(meta) {
  const rows = meta.map(({ key, value }) => {
    const isStatus = /^status$/i.test(key);
    const tone = /pending|draft|skeleton|proposed/i.test(value) ? 'warn'
      : /superseded|rejected/i.test(value) ? 'danger'
        : /accepted/i.test(value) ? 'ok' : 'neutral';
    const val = isStatus
      ? `<span class="badge badge--${tone}">${inline(value)}</span>`
      : inline(value);
    return `<div class="meta-row"><dt>${escapeHtml(key)}</dt><dd>${val}</dd></div>`;
  }).join('\n');
  return `<dl class="meta">\n${rows}\n</dl>`;
}

/** Markdown string -> {title, html, meta, toc}. */
function renderMarkdown(md) {
  const lines = md.replace(/\r\n?/g, '\n').split('\n');

  let title = null;
  let h1 = -1;
  lines.forEach((line, idx) => {
    const m = line.match(RE.heading);
    if (h1 === -1 && m && m[1].length === 1) { h1 = idx; title = m[2]; }
  });

  const meta = [];
  if (h1 !== -1) {
    let j = h1 + 1;
    while (j < lines.length && lines[j].trim() === '') j += 1;
    const metaStart = j;
    while (j < lines.length) {
      const m = lines[j].match(RE.meta);
      if (!m) break;
      let value = m[2];
      j += 1;
      while (j < lines.length && lines[j].trim() !== '' &&
             !RE.meta.test(lines[j]) && indentOf(lines[j]) > 0) {
        value += ` ${lines[j].trim()}`;
        j += 1;
      }
      meta.push({ key: m[1], value });
    }
    if (meta.length) lines.splice(metaStart, j - metaStart);
  }

  const shift = headingShift(lines);
  if (shift > 0) promoteHeadings(lines, shift);

  const ctx = { toc: [] };
  const { html } = renderBlocks(lines, ctx);
  return { title, html, meta: meta.length ? renderMeta(meta) : '', toc: ctx.toc };
}

/** Documents that begin at `###` (the ADRs) need their sections promoted to
 *  `##` so the outline never skips a level. Returns the shift to apply. */
function headingShift(lines) {
  const levels = [];
  let inFence = false;
  lines.forEach((line) => {
    if (RE.fence.test(line)) { inFence = !inFence; return; }
    if (inFence) return;
    const m = line.match(RE.heading);
    if (m && m[1].length > 1) levels.push(m[1].length);
  });
  if (!levels.length) return 0;
  return Math.min.apply(null, levels) - 2;
}

function promoteHeadings(lines, shift) {
  let inFence = false;
  for (let i = 0; i < lines.length; i += 1) {
    if (RE.fence.test(lines[i])) { inFence = !inFence; continue; }
    if (inFence) continue;
    const m = lines[i].match(RE.heading);
    if (!m || m[1].length === 1) continue;
    const level = Math.max(2, m[1].length - shift);
    lines[i] = `${'#'.repeat(level)} ${m[2]}`;
  }
}

const readingTime = (md) => {
  const words = md.replace(/[`|>#*\[\]()]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

const plainText = (s) => s.replace(/`/g, '').replace(/\*\*/g, '').replace(/[*_>|]/g, ' ')
  .replace(/\s+/g, ' ').trim();

// ------------------------------------------------------------------ shell

const relRoot = (out) => '../'.repeat(out.split('/').length - 1);

const ICONS = {
  home: '<path d="M3.5 11.5 12 4.2l8.5 7.3"/><path d="M6 10.4V19.5h12V10.4"/>',
  map: '<path d="M4 6.5v12l5-2 5 2 6-2.5v-12L14 6.5l-5-2z"/><path d="M9 4.5v12"/><path d="M14 6.5v12"/>',
  layers: '<path d="M12 4 3.5 8.5 12 13l8.5-4.5z"/><path d="m4.5 12.5 7.5 4 7.5-4"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12"/><path d="M4 6h.01M4 12h.01M4 18h.01"/>',
  flag: '<path d="M6 3.5v17"/><path d="M6 4.5h12l-2.2 4 2.2 4H6"/>',
  doc: '<path d="M6.5 3.5h7l4.5 4.5v12.5h-11.5z"/><path d="M13.5 3.5V8H18"/>',
  shield: '<path d="M12 3.5 5 6.2v5.6c0 4.2 2.9 7.4 7 8.7 4.1-1.3 7-4.5 7-8.7V6.2z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
  clipboard: '<path d="M9 4.5H7.5v15h9v-15H15"/><path d="M9.5 3.5h5v2.2h-5z"/><path d="m9.5 13 1.8 1.8 3.6-3.6"/>',
  coins: '<ellipse cx="12" cy="6.5" rx="6.5" ry="2.8"/><path d="M5.5 6.5v11c0 1.5 2.9 2.8 6.5 2.8s6.5-1.3 6.5-2.8v-11"/><path d="M5.5 12c0 1.5 2.9 2.8 6.5 2.8s6.5-1.3 6.5-2.8"/>',
  search: '<circle cx="10.5" cy="10.5" r="6"/><path d="m15 15 4.5 4.5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/>',
  moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5"/>',
};

const icon = (name, cls = 'ic') =>
  `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ` +
  `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ICONS.doc}</svg>`;

function navHtml(current, root) {
  return GROUP_ORDER.map((group) => {
    const items = PAGES.filter((p) => p.group === group);
    if (!items.length) return '';
    const links = items.map((p) => {
      const active = p.out === current;
      const cls = p.adr ? 'nav-link nav-link--sub' : 'nav-link';
      return `<li><a class="${cls}" href="${root}${p.out}"${active ? ' aria-current="page"' : ''}>` +
        `${icon(p.icon, 'ic ic--sm')}<span>${escapeHtml(p.title)}</span></a></li>`;
    }).join('\n');
    return `<div class="nav-group">\n<h2 class="nav-group__title">${escapeHtml(group)}</h2>\n` +
      `<ul class="nav-list">\n${links}\n</ul>\n</div>`;
  }).join('\n');
}

function tocHtml(toc) {
  if (!toc.length) return '<p class="toc-empty">No sections.</p>';
  const items = toc.map((t) =>
    `<li class="toc-l${t.level}"><a href="#${t.id}">${escapeHtml(t.text)}</a></li>`).join('\n');
  return `<ul class="toc-list">\n${items}\n</ul>`;
}

function pagerHtml(page, root) {
  const idx = PAGES.findIndex((p) => p.out === page.out);
  const prev = PAGES[idx - 1];
  const next = PAGES[idx + 1];
  const arrow = (dir) => `<span class="pager-arrow" aria-hidden="true">${dir === 'prev' ? '←' : '→'}</span>`;
  const link = (p, dir) => {
    if (!p) return '<span></span>';
    return `<a class="pager-link pager-link--${dir}" rel="${dir}" href="${root}${p.out}">` +
      (dir === 'prev' ? arrow(dir) : '') +
      `<span><span class="pager-label">${dir === 'prev' ? 'Previous' : 'Next'}</span>` +
      `<span class="pager-title">${escapeHtml(p.title)}</span></span>` +
      (dir === 'next' ? arrow(dir) : '') + '</a>';
  };
  return `<nav class="pager" aria-label="Document navigation">\n${link(prev, 'prev')}\n${link(next, 'next')}\n</nav>`;
}

function shell({ page, body, meta, toc, root, crumbs }) {
  const title = page.title;
  return `<!doctype html>
<html lang="en-AU" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>${escapeHtml(title)} · ${SITE.name} ${SITE.tagline}</title>
<meta name="description" content="${escapeHtml(page.summary || SITE.tagline)}">
<link rel="stylesheet" href="${root}assets/styles.css">
<link rel="icon" href="${root}assets/favicon.svg" type="image/svg+xml">
<script>(function(){try{var t=localStorage.getItem('knoxus-theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){}})();</script>
</head>
<body data-root="${root}">
<a class="skip" href="#content">Skip to content</a>
<div class="progress" aria-hidden="true"><span id="progress-bar"></span></div>
${topbarHtml(root)}
<div class="layout">
  <nav class="sidebar" id="sidebar" aria-label="Documentation sections">
${navHtml(page.out, root)}
    <div class="nav-group nav-group--foot">
      <h2 class="nav-group__title">Repository</h2>
      <ul class="nav-list">
        <li><a class="nav-link nav-link--sub" href="${SITE.repo}" target="_blank" rel="noopener noreferrer">${icon('doc', 'ic ic--sm')}<span>GitHub <span aria-hidden="true">↗</span></span></a></li>
      </ul>
    </div>
  </nav>
  <main class="content" id="content">
    <nav class="crumbs" aria-label="Breadcrumb">${crumbs}</nav>
${meta}
    <article class="prose">
${body}
    </article>
${pagerHtml(page, root)}
    <footer class="page-foot">
      <p>Source of truth: <code>${escapeHtml(sourceLabel(page.src))}</code> · generated by <code>site/build.mjs</code> · status: ${SITE.status}</p>
      <p><a href="#content">Back to top</a></p>
    </footer>
  </main>
  <aside class="toc" aria-label="On this page">
    <h2 class="toc-title">On this page</h2>
${tocHtml(toc)}
  </aside>
</div>
${searchDlgHtml()}
<script src="${root}assets/search-index.js" defer></script>
<script src="${root}assets/app.js" defer></script>
</body>
</html>
`;
}

// ----------------------------------------------------------- page fragments

function topbarHtml(root) {
  return `<header class="topbar">
  <button class="icon-btn nav-toggle" type="button" data-nav-toggle aria-expanded="false" aria-controls="sidebar" aria-label="Show navigation">
    <span class="ic-bar" aria-hidden="true"></span>
  </button>
  <a class="brand" href="${root}index.html">
    <span class="brand-mark" aria-hidden="true">K</span>
    <span class="brand-text"><strong>${SITE.name}</strong><span>${SITE.tagline}</span></span>
  </a>
  <button class="search-trigger" type="button" data-search-open aria-haspopup="dialog">
    ${icon('search', 'ic ic--sm')}<span>Search docs</span><kbd aria-hidden="true">/</kbd>
  </button>
  <button class="icon-btn theme-btn" type="button" data-theme-toggle aria-label="Switch colour theme">
    ${icon('sun', 'ic ic--sm theme-icon theme-icon--sun')}${icon('moon', 'ic ic--sm theme-icon theme-icon--moon')}
  </button>
</header>`;
}

function searchDlgHtml() {
  return `<dialog class="searchdlg" id="search" aria-label="Search documentation">
  <div class="search-box">
    ${icon('search', 'ic ic--sm')}
    <label class="visually-hidden" for="search-input">Search documentation</label>
    <input type="search" id="search-input" placeholder="Search headings and text…" autocomplete="off" aria-controls="search-results" aria-describedby="search-status">
    <button class="search-close" type="button" data-search-close>Close</button>
  </div>
  <p class="search-status" id="search-status" role="status" aria-live="polite"></p>
  <ul class="search-results" id="search-results"></ul>
</dialog>`;
}

function crumbsHtml(page, root) {
  const items = [
    { label: 'Home', href: `${root}index.html` },
    { label: page.group },
    { label: page.title },
  ];
  return items.map((c, i) => {
    const last = i === items.length - 1;
    if (last) return `<span aria-current="page">${escapeHtml(c.label)}</span>`;
    const node = c.href
      ? `<a href="${c.href}">${escapeHtml(c.label)}</a>`
      : `<span>${escapeHtml(c.label)}</span>`;
    return `${node} <span class="crumb-sep" aria-hidden="true">/</span> `;
  }).join('');
}

// ----------------------------------------------------------------- landing

function landing({ cards, board, stats }) {
  const groups = GROUP_ORDER.map((group) => {
    const items = cards.filter((c) => c.group === group);
    if (!items.length) return '';
    const lis = items.map((c) => `<li><a class="card" href="${c.out}">
      <span class="card-icon" aria-hidden="true">${icon(c.icon)}</span>
      <span class="card-body">
        <span class="card-title">${escapeHtml(c.title)}</span>
        <span class="card-sum">${escapeHtml(c.summary || '')}</span>
        <span class="card-meta">${c.minutes} min read · <code>${escapeHtml(sourceLabel(c.src))}</code></span>
      </span>
    </a></li>`).join('\n');
    return `<section class="lp-section" aria-labelledby="lp-${slug(group)}">
  <h2 class="lp-h2" id="lp-${slug(group)}">${escapeHtml(group)}</h2>
  <ul class="cards">
${lis}
  </ul>
</section>`;
  }).join('\n');

  const boardItems = board.map((b) =>
    `<li class="task${b.done ? ' is-done' : ''}"><span class="box" role="img" ` +
    `aria-label="${b.done ? 'done' : 'not done'}">${b.done ? '✓' : ''}</span><span>${inline(b.text)}</span></li>`).join('\n');

  const statItems = stats.map((s) =>
    `<div class="stat"><dt>${escapeHtml(s.label)}</dt><dd>${escapeHtml(String(s.value))}</dd></div>`).join('\n');

  return `<!doctype html>
<html lang="en-AU" data-theme="dark">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light">
<title>${SITE.name} — ${SITE.tagline}</title>
<meta name="description" content="Engineering documentation for Knoxus: plan, architecture, decision records, threat model, DPIA and credits model. Pre-code, docs-only.">
<link rel="stylesheet" href="assets/styles.css">
<link rel="icon" href="assets/favicon.svg" type="image/svg+xml">
<script>(function(){try{var t=localStorage.getItem('knoxus-theme');if(!t){t=window.matchMedia&&window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.dataset.theme=t;}catch(e){}})();</script>
</head>
<body data-root="">
<a class="skip" href="#content">Skip to content</a>
<div class="progress" aria-hidden="true"><span id="progress-bar"></span></div>
${topbarHtml('')}
<main class="landing" id="content">
  <section class="hero" aria-labelledby="hero-title">
    <p class="hero-eyebrow">${SITE.status}</p>
    <h1 class="hero-title" id="hero-title">${SITE.name}</h1>
    <p class="hero-lede">A school-scoped platform for posting, messaging, highlights, communities and
      student compute — documented down to the constraints it refuses to break.</p>
    <p class="hero-actions">
      <a class="btn btn--primary" href="handoff.html">Start here — handoff</a>
      <a class="btn" href="docs/PLAN.html">Read the plan</a>
      <a class="btn" href="docs/architecture/STACK.html">Technology stack</a>
      <a class="btn" href="docs/threat-model/THREAT-MODEL.html">Threat model</a>
    </p>
    <dl class="stats">
${statItems}
    </dl>
  </section>

  <section class="lp-section" aria-labelledby="lp-gates">
    <h2 class="lp-h2" id="lp-gates">Before any code</h2>
    <div class="gate">
      <ol>
        <li><strong>Jurisdiction and sanction</strong> — confirm the school and that the product is school-authorised, not independent.</li>
        <li><strong>Chat model</strong> — accept the tiered, disclosed-monitoring model in <a href="docs/adr/0005-chat-privacy-tiering.html">ADR-0005</a> or choose another explicitly.</li>
        <li><strong>Counsel review</strong> — the ten questions in the <a href="docs/compliance/DPIA.html">DPIA</a>: the under-16 carve-outs, monitored chat, retention, and cross-border AI.</li>
      </ol>
      <p class="gate-note">The plan is gated on purpose: no chat, no compute and no economy until those are settled in writing.</p>
    </div>
  </section>

${groups}

  <section class="lp-section" aria-labelledby="lp-board">
    <h2 class="lp-h2" id="lp-board">Status board</h2>
    <ul class="tasks">
${boardItems}
    </ul>
  </section>

  <section class="lp-section" aria-labelledby="lp-quickstart">
    <h2 class="lp-h2" id="lp-quickstart">Working on these docs</h2>
    <div class="code"><div class="code-head"><span class="code-lang">shell</span><button class="copy" type="button" data-copy>Copy</button></div><pre tabindex="0"><code>node site/build.mjs         # regenerate this site from /docs
node site/serve.mjs         # preview on http://localhost:4173
node site/tools/audit.mjs   # contrast, link and structure checks</code></pre></div>
    <p class="note">The markdown in <code>docs/</code> is the source of truth. This site is generated from it
      and never hand-edited, so the documentation and the site cannot drift apart.</p>
  </section>

  <footer class="lp-foot">
    <p>${SITE.name} · ${SITE.tagline} · generated from <code>docs/</code> by <code>site/build.mjs</code> ·
      no trackers, no external requests, works offline.</p>
  </footer>
</main>
${searchDlgHtml()}
<script src="assets/search-index.js" defer></script>
<script src="assets/app.js" defer></script>
</body>
</html>
`;
}

// ------------------------------------------------------- index and generator

/** Fingerprint of every markdown source, so a stale build is detectable. */
function sourceHash() {
  const hash = createHash('sha256');
  for (const page of PAGES) {
    const file = join(SRC, page.src);
    hash.update(page.src);
    hash.update(existsSync(file) ? readFileSync(file) : 'MISSING');
  }
  hash.update(readFileSync(join(HERE, 'assets', 'styles.css')));
  hash.update(readFileSync(join(HERE, 'assets', 'app.js')));
  return hash.digest('hex').slice(0, 16);
}

const stripTags = (s) => s.replace(/<[^>]+>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
  .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();

/** One search entry per section, path relative to the site root. */
function indexPage(page, html) {
  const entries = [];
  const re = /<h([234]) id="([^"]+)"[^>]*>([\s\S]*?)<\/h\1>/g;
  const marks = [];
  let m;
  while ((m = re.exec(html))) {
    marks.push({
      level: Number(m[1]), id: m[2],
      text: stripTags(m[3].replace(/<a class="anchor"[\s\S]*?<\/a>/g, '')),
      start: m.index, end: re.lastIndex,
    });
  }
  if (!marks.length) {
    entries.push({ p: page.out, t: page.title, h: page.title, a: '', x: stripTags(html).slice(0, 800) });
    return entries;
  }
  marks.forEach((mark, i) => {
    const stop = i + 1 < marks.length ? marks[i + 1].start : html.length;
    entries.push({
      p: page.out, t: page.title, h: mark.text, a: mark.id,
      x: stripTags(html.slice(mark.end, stop)).slice(0, 900),
    });
  });
  return entries;
}

/** Reads `- [x]` / `- [ ]` items out of the "Status board" section. */
function readBoard(md) {
  const out = [];
  let inside = false;
  for (const line of md.split('\n')) {
    if (/^##\s+Status board/i.test(line)) { inside = true; continue; }
    if (inside && /^##\s+/.test(line)) break;
    const m = inside ? line.match(/^\s*-\s+\[([ xX])\]\s+(.*)$/) : null;
    if (m) out.push({ done: m[1].toLowerCase() === 'x', text: m[2].trim() });
  }
  return out;
}

function main() {
  const t0 = Date.now();
  if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });
  mkdirSync(join(OUT, 'assets'), { recursive: true });
  cpSync(join(HERE, 'assets'), join(OUT, 'assets'), { recursive: true });

  const index = [];
  const cards = [];
  const built = [];
  const missing = [];
  const leftovers = [];

  for (const page of PAGES) {
    const file = join(SRC, page.src);
    if (!existsSync(file)) { missing.push(page.src); continue; }
    const md = readFileSync(file, 'utf8');
    const { html, meta, toc } = renderMarkdown(md);
    const root = relRoot(page.out);
    const outFile = join(OUT, page.out);
    mkdirSync(dirname(outFile), { recursive: true });
    writeFileSync(outFile, shell({ page, body: html, meta, toc, root, crumbs: crumbsHtml(page, root) }), 'utf8');
    if (/\]\(/.test(html)) leftovers.push(page.src);
    index.push(...indexPage(page, html));
    cards.push({ ...page, minutes: readingTime(md) });
    built.push({ page, minutes: readingTime(md) });
  }

  const threat = join(SRC, 'threat-model/THREAT-MODEL.md');
  const abuseCases = existsSync(threat)
    ? (readFileSync(threat, 'utf8').match(/^\| AC-\d+/gm) || []).length : 0;
  const docsIndex = join(SRC, 'README.md');
  const board = existsSync(docsIndex) ? readBoard(readFileSync(docsIndex, 'utf8')) : [];

  const totalMinutes = built.reduce((n, b) => n + b.minutes, 0);
  const stats = [
    { label: 'Documents', value: built.length },
    { label: 'Reading time', value: `${totalMinutes} min` },
    { label: 'Decision records', value: PAGES.filter((p) => p.adr).length },
    { label: 'Abuse cases', value: abuseCases },
  ];

  const landingFile = join(OUT, 'index.html');
  writeFileSync(landingFile, landing({ cards, board, stats }), 'utf8');

  const payload = JSON.stringify(index).replace(/</g, '\\u003c');
  writeFileSync(join(OUT, 'assets', 'search-index.js'),
    `/* Generated by site/build.mjs — do not edit. */\nwindow.KNOXUS_INDEX = ${payload};\n`, 'utf8');

  // Source fingerprint, so a stale build can be detected instead of trusted.
  const manifest = {
    generatedAt: new Date().toISOString(),
    pages: built.length,
    searchEntries: index.length,
    sourceHash: sourceHash(),
  };
  writeFileSync(join(OUT, 'assets', 'build.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

  const ms = Date.now() - t0;
  console.log(`Knoxus docs built in ${ms} ms`);
  console.log(`  pages:    ${built.length} + landing page`);
  console.log(`  search:   ${index.length} sections indexed`);
  console.log(`  output:   site/dist (${stats[1].value} of reading)`);
  if (missing.length) console.log(`  missing:  ${missing.join(', ')}`);
  if (leftovers.length) console.log(`  WARNING:  unconverted markdown in ${leftovers.join(', ')}`);
  if (!missing.length && !leftovers.length) console.log('  checks:   clean');
}

main();








