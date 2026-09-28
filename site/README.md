# Knoxus documentation site

A static documentation site generated from the markdown in [`../docs`](../docs). Plain HTML, CSS and
JavaScript — **zero dependencies**, no build tooling to install, no network requests at build time or
in the browser.

```
node site/build.mjs         # regenerate site/dist from /docs
node site/serve.mjs         # preview on http://localhost:4173
node site/tools/audit.mjs   # contrast, structure, link and freshness checks
```

`site/dist/` is committed so the site can be opened straight from a checkout
(`site/dist/index.html` works from `file://` as well as over HTTP). The audit fails if the committed
build no longer matches the markdown it was generated from.

## Layout

| Path | Purpose |
|---|---|
| `build.mjs` | Markdown → HTML generator, navigation model, search index, landing page |
| `assets/styles.css` | Single stylesheet: design tokens, layout, prose, print, preferences |
| `assets/app.js` | Theme, drawer navigation, search, scrollspy, copy buttons, progress bar |
| `assets/favicon.svg` | Hand-authored icon (no binary assets anywhere) |
| `serve.mjs` | Preview server: correct MIME types, `no-store`, path-traversal guarded |
| `tools/audit.mjs` | The verification gate described below |
| `dist/` | Generated output (never edit by hand) |

## Markdown support

The generator implements the subset the documentation actually uses, deliberately rather than
pulling in a parser: ATX headings **h1–h4**, paragraphs, ordered and unordered lists (with
continuation lines and one level of nesting), `- [x]` task lists, tables with alignment and pipes
inside `code spans`, fenced code blocks, blockquotes (including blockquotes containing tables),
horizontal rules, and inline `code`, **bold**, *italic* and links.

Three behaviours are worth knowing:

1. **Links are rewritten** — `PLAN.md` → `PLAN.html`, `adr/` → `adr/index.html`. External links open
   in a new tab with a visual marker.
2. **Heading depth is normalised** — documents that start at `###` (the ADRs) are promoted to `##`, so
   the outline never skips a level.
3. **`- **Status:** …` blocks become a meta card** — ADR headers render as a definition list with a
   status badge instead of as prose.

Escaping happens before inline formatting, so document content can never inject markup.

## Design system

- **Tokens only.** Colour, type scale, spacing, radii and motion live in `:root` and the two theme
  blocks. No component hard-codes a colour.
- **Dark first, light supported**, following `prefers-color-scheme` on first visit and a stored
  preference afterwards. A tiny inline script sets the theme before first paint, so there is no flash.
- **System fonts only** — nothing to download, nothing to wait for, no third-party request.
- **Three-column reading layout** on wide screens (navigation, article, on-this-page rail), collapsing
  to a drawer plus single column on small screens; articles are capped at a 74-character measure.
- **Print stylesheet** that drops chrome, expands link URLs and keeps tables intact.

## Accessibility

Target: **WCAG 2.2 AAA for contrast, AA for everything else** — and where practical, AAA.

| Measure | Implementation |
|---|---|
| Contrast | Every declared text pair ≥ 7:1; borders and focus rings ≥ 3:1; enforced by `tools/audit.mjs` |
| Landmarks | `header`, `nav` (labelled), `main`, `aside`, labelled `dialog`; breadcrumb navigation |
| Headings | Exactly one `h1`; no level skips; every section anchored and linkable |
| Keyboard | Skip link, visible 3px focus ring, `/` and `⌘K`/`Ctrl K` open search, arrow keys move through results, `Esc` closes |
| Tables | `<thead>` with scoped headers, wrapped in a labelled, focusable scroll region |
| Screen readers | Live search status, `aria-current` on the active page and section, labelled icon buttons, decorative icons hidden |
| Preferences | `prefers-reduced-motion`, `prefers-contrast: more`, `forced-colors: active`, 200% zoom and 320px reflow |
| No JS required | Navigation, reading and printing all work with JavaScript disabled |

## Adding a document

1. Add the markdown to `docs/`.
2. Add an entry to `PAGES` in `build.mjs` (`src`, `out`, `group`, `title`, `summary`, `icon`).
   Order in that array defines the sidebar, the previous/next chain and the landing-page cards.
3. Rebuild and audit:

```
node site/build.mjs && node site/tools/audit.mjs
```

## What the audit checks

**Contrast** — 19 token pairs × 2 themes against WCAG 2.2 AAA thresholds. Decorative tokens
(`border-soft`, `tint`, `shadow`) are excluded by policy and that exclusion is printed as a note
rather than hidden.

**Structure and integrity** — for every generated page: doctype, `lang`, charset/viewport/color-scheme
meta, title, description, skip link, `main` landmark, exactly one `h1`, no level jumps, scoped table
headers, labelled navigation and controls, no unconverted markdown, no leaked `undefined`, no external
resource requests, and every internal link resolving to a file that exists (including TOC anchors).

**Build integrity** — required assets present, search index non-trivial, and the committed build's
source fingerprint matching the current markdown and assets.

The script exits non-zero on any failure, so it works as a CI gate.
