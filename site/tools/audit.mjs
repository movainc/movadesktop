#!/usr/bin/env node
/**
 * Audit for the generated documentation site.
 *
 *   node site/tools/audit.mjs
 *
 * Three families of checks, all of which must pass:
 *   1. Contrast — declared token pairs meet WCAG 2.2 AAA
 *      (7:1 for text, 3:1 for UI boundaries and focus indicators).
 *   2. Structure — landmarks, headings, labels, table markup, no leftovers.
 *   3. Integrity — every internal link resolves; no external resource requests.
 *
 * Exits non-zero on any failure, so CI can gate on it.
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const SITE_DIR = resolve(HERE, '..');
const DIST = join(SITE_DIR, 'dist');
const CSS = join(SITE_DIR, 'assets', 'styles.css');

const failures = [];
const notes = [];
const fail = (message) => failures.push(message);

/* ---------------------------------------------- 1. Contrast ---------------- */

const hexToRgb = (hex) => {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  return [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16));
};
const channel = (component) => {
  const v = component / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
};
const luminance = (hex) => {
  const [r, g, b] = hexToRgb(hex).map(channel);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((m, n) => n - m);
  return (hi + 0.05) / (lo + 0.05);
};

function tokensFor(theme) {
  const css = readFileSync(CSS, 'utf8');
  const block = new RegExp(`html\\[data-theme="${theme}"\\]\\s*\\{([\\s\\S]*?)\\}`).exec(css);
  if (!block) throw new Error(`theme block not found: ${theme}`);
  const tokens = {};
  block[1].split('\n').forEach((line) => {
    const m = line.match(/--([\w-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/);
    if (m) tokens[m[1]] = m[2];
  });
  return tokens;
}

/** [foreground, background, minimum ratio, description] */
const PAIRS = [
  ['text', 'bg', 7, 'body text on page'],
  ['text', 'surface', 7, 'text on raised surface'],
  ['text', 'surface-2', 7, 'text on soft surface'],
  ['muted', 'bg', 7, 'muted text on page'],
  ['muted', 'surface', 7, 'muted text on surface'],
  ['muted', 'surface-2', 7, 'muted text on soft surface'],
  ['faint', 'bg', 7, 'tertiary text on page'],
  ['faint', 'surface-2', 7, 'tertiary text on soft surface'],
  ['link', 'bg', 7, 'link on page'],
  ['link', 'surface', 7, 'link on surface'],
  ['link', 'surface-2', 7, 'link on soft surface'],
  ['accent-ink', 'accent-bg', 7, 'accent button label'],
  ['ok-ink', 'ok-bg', 7, 'success badge'],
  ['warn-ink', 'warn-bg', 7, 'warning badge'],
  ['danger-ink', 'danger-bg', 7, 'danger badge'],
  ['border', 'surface', 3, 'UI border on surface'],
  ['border', 'bg', 3, 'UI border on page'],
  ['focus', 'bg', 3, 'focus indicator on page'],
  ['focus', 'surface', 3, 'focus indicator on surface'],
];

function reportContrast() {
  console.log('Contrast — WCAG 2.2 AAA (7:1 text, 3:1 UI)');
  ['dark', 'light'].forEach((theme) => {
    const tokens = tokensFor(theme);
    console.log(`  ${theme} theme`);
    PAIRS.forEach(([fg, bg, min, label]) => {
      if (!tokens[fg] || !tokens[bg]) {
        fail(`contrast: token pair ${fg}/${bg} missing in ${theme}`);
        return;
      }
      const ratio = contrast(tokens[fg], tokens[bg]);
      const ok = ratio >= min;
      if (!ok) fail(`contrast ${theme}: ${tokens[fg]} on ${tokens[bg]} = ${ratio.toFixed(2)}:1 (needs ${min}:1) — ${label}`);
      console.log(`    ${ok ? 'pass' : 'FAIL'}  ${ratio.toFixed(2).padStart(6)}:1  >= ${min}  ${label}`);
    });
  });
  notes.push('border-soft, tint and shadow are decorative by policy and excluded from the 3:1 rule: they carry no information alone, and structure is also conveyed by spacing, weight and alternating fills.');
}

/* ------------------------------------ 2. Structure and integrity ---------- */

const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
  (entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)]));

function checkHtml(file) {
  const html = readFileSync(file, 'utf8');
  const rel = relative(DIST, file);
  const need = (condition, message) => { if (!condition) fail(`${rel}: ${message}`); };

  need(/^<!doctype html>/i.test(html), 'missing doctype');
  need(/<html lang="en-AU"/.test(html), 'missing lang attribute');
  need(/<meta charset="utf-8">/.test(html), 'missing charset meta');
  need(/<meta name="viewport"/.test(html), 'missing viewport meta');
  need(/<meta name="color-scheme"/.test(html), 'missing color-scheme meta');
  need(/<title>[^<]{3,}<\/title>/.test(html), 'missing or empty title');
  need(/<meta name="description" content="[^"]{10,}"/.test(html), 'missing description meta');
  need(/class="skip" href="#content"/.test(html), 'missing skip link');
  need(/<main[^>]*id="content"/.test(html), 'missing main landmark with id="content"');
  need((html.match(/<h1\b/g) || []).length === 1, 'expected exactly one h1');

  const outline = (html.match(/<h([1-6])\b/g) || []).map((s) => Number(s.slice(2, 3)));
  outline.forEach((level, i) => {
    if (i === 0) return;
    const previous = outline[i - 1];
    need(level <= previous + 1, `heading level jumps from h${previous} to h${level}`);
  });
  need(!/\]\(/.test(html), 'unconverted markdown link in output');
  need(!/>undefined</.test(html), 'undefined leaked into output');

  (html.match(/<table\b[\s\S]*?<\/table>/g) || []).forEach((table, index) => {
    need(/<thead\b/.test(table), `table ${index + 1} missing thead`);
    need(/<th scope="col"/.test(table), `table ${index + 1} missing scoped column headers`);
    need(/<tbody\b/.test(table), `table ${index + 1} missing tbody`);
  });

  const ids = new Set((html.match(/\sid="[^"]+"/g) || []).map((s) => s.slice(5, -1)));
  const toc = (html.match(/class="toc-list"[\s\S]*?<\/ul>/) || [''])[0];
  (toc.match(/href="#[^"]+"/g) || []).forEach((href) => {
    const id = href.slice(7, -1);
    need(ids.has(id), `TOC link #${id} has no matching heading id`);
  });

  (html.match(/<nav\b[^>]*>/g) || []).forEach((tag) => {
    need(/aria-label="[^"]+"/.test(tag), `nav landmark without aria-label: ${tag.slice(0, 70)}`);
  });
  need(/aria-label="Search documentation"/.test(html), 'search input has no accessible label');
  need(/<aside[^>]*aria-label="[^"]+"/.test(html) || !/<aside\b/.test(html),
    'aside landmark without aria-label');
  need(/<button[^>]*aria-label="[^"]+"/.test(html), 'icon-only button without aria-label');

  const external = html.match(/(?:src|href)="https?:\/\/[^"]+\.(?:css|js|png|jpe?g|svg|woff2?|ttf)"/g) || [];
  need(external.length === 0, `external resource reference: ${external.join(', ')}`);

  (html.match(/href="[^"#][^"]*"/g) || []).forEach((raw) => {
    const href = raw.slice(6, -1);
    if (/^(https?:|mailto:|data:)/.test(href)) return;
    const clean = href.split('#')[0];
    if (!clean) return;
    need(existsSync(resolve(dirname(file), clean)), `broken internal link → ${href}`);
  });
}

/* ------------------------------------------------- 3. Build and run ------- */

if (!existsSync(DIST)) {
  fail('site/dist does not exist — run `node site/build.mjs` first');
} else {
  reportContrast();

  const htmlFiles = walk(DIST).filter((f) => f.endsWith('.html'));
  console.log(`\nStructure and integrity — ${htmlFiles.length} generated pages`);
  htmlFiles.forEach(checkHtml);
  console.log(`  rules applied: doctype, lang, meta, landmarks, headings, tables,`);
  console.log(`                 labelled controls, no external resources, internal link resolution`);

  console.log('\nBuilt assets');
  ['assets/styles.css', 'assets/app.js', 'assets/search-index.js', 'assets/favicon.svg']
    .forEach((asset) => {
      const present = existsSync(join(DIST, asset));
      if (!present) fail(`missing built asset: ${asset}`);
      console.log(`  ${present ? 'pass' : 'FAIL'}  ${asset}`);
    });

  const indexFile = join(DIST, 'assets', 'search-index.js');
  if (existsSync(indexFile)) {
    const text = readFileSync(indexFile, 'utf8');
    const count = (text.match(/"p":/g) || []).length;
    console.log(`  search index entries: ${count}`);
    if (count < 50) fail(`search index looks too small (${count} entries)`);
  }

  // Freshness: the build stamps a hash of docs + assets, so a committed build
  // cannot drift silently from the markdown it claims to represent.
  const manifestFile = join(DIST, 'assets', 'build.json');
  if (!existsSync(manifestFile)) {
    fail('missing build manifest: assets/build.json');
  } else {
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
    const expected = sourceHash();
    if (manifest.sourceHash !== expected) {
      fail(`site/dist is stale (built from ${manifest.sourceHash}, sources are ${expected})` +
        ' — run `node site/build.mjs`');
    } else {
      console.log(`  freshness: build matches sources (${expected})`);
    }
  }
}

/** Same fingerprint recipe as site/build.mjs — keep the two in step. */
function sourceHash() {
  const hash = createHash('sha256');
  const docsDir = resolve(SITE_DIR, '..', 'docs');
  const manifest = readFileSync(join(SITE_DIR, 'build.mjs'), 'utf8')
    .match(/const PAGES = \[([\s\S]*?)\n\];/);
  const srcs = manifest ? (manifest[1].match(/src: '([^']+)'/g) || [])
    .map((s) => s.slice(6, -1)) : [];
  srcs.forEach((src) => {
    const file = join(docsDir, src);
    hash.update(src);
    hash.update(existsSync(file) ? readFileSync(file) : 'MISSING');
  });
  hash.update(readFileSync(join(SITE_DIR, 'assets', 'styles.css')));
  hash.update(readFileSync(join(SITE_DIR, 'assets', 'app.js')));
  return hash.digest('hex').slice(0, 16);
}

console.log('\nSummary');
notes.forEach((note) => console.log(`  note: ${note}`));
if (failures.length) {
  console.log(`  ${failures.length} failure(s):`);
  failures.forEach((message) => console.log(`    x ${message}`));
  process.exitCode = 1;
} else {
  console.log('  ok — all checks passed');
}

