// Builds the static website into website/dist: every page in pages/ is wrapped in layout.html,
// and the legal pages are rendered from the repository's Markdown so there is one source of truth.
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const out = join(here, "dist");
const layout = readFileSync(join(here, "layout.html"), "utf8");

const render = ({ title, description, nav, path, content }) =>
  layout
    .replaceAll("{{title}}", title)
    .replaceAll("{{description}}", description)
    .replaceAll("{{nav}}", nav)
    .replaceAll("{{path}}", path)
    .replace("{{content}}", content)
    .replace(`data-nav="${nav}"`, `data-nav="${nav}" aria-current="page"`);

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, "assets/screenshots"), { recursive: true });
cpSync(join(here, "styles.css"), join(out, "styles.css"));
cpSync(join(here, "main.js"), join(out, "main.js"));
cpSync(join(root, "public/mova.svg"), join(out, "assets/mova.svg"));
cpSync(join(root, "docs/screenshots"), join(out, "assets/screenshots"), { recursive: true });

for (const file of readdirSync(join(here, "pages"))) {
  const src = readFileSync(join(here, "pages", file), "utf8");
  const meta = JSON.parse(src.match(/^<!--meta\s+([\s\S]*?)\s*-->/)[1]);
  const content = src.replace(/^<!--meta[\s\S]*?-->\s*/, "");
  const name = file.replace(/\.html$/, "");
  const path = name === "index" ? "/" : `/${name}`;
  writeFileSync(join(out, file), render({ ...meta, path, content }));
}

const LEGAL = [
  ["terms", "TERMS.md", "Terms of Use", "The terms that apply when you use mova."],
  ["privacy", "PRIVACY.md", "Privacy Notice", "What mova stores, what it sends, and your choices."],
  ["licenses", "THIRD_PARTY_NOTICES.md", "Open-source licences", "The open-source software mova is built on."],
];
for (const [name, file, title, description] of LEGAL) {
  const md = readFileSync(join(root, file), "utf8")
    .replace(/\]\((licenses|docs)\//g, "](https://github.com/movainc/movadesktop/blob/main/$1/")
    .replace(/\]\((TERMS|PRIVACY|THIRD_PARTY_NOTICES)\.md\)/g, (_, f) => `](/${{ TERMS: "terms", PRIVACY: "privacy", THIRD_PARTY_NOTICES: "licenses" }[f]})`)
    .replace(/\]\(docs\/AI\.md\)/g, "](https://movadocs.vercel.app/ai)");
  const content = `<article class="doc wrap-narrow">${marked.parse(md)}</article>`;
  writeFileSync(join(out, `${name}.html`), render({ title: `${title} — mova`, description, nav: name, path: `/${name}`, content }));
}

console.log("website built →", out);
