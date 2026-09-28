import { marked } from "/assets/marked.esm.js";

const SECTIONS = [
  { title: "Get started", pages: [
    { slug: "", file: "INTRODUCTION.md", label: "Introduction", icon: "⌂" },
    { slug: "getting-started", file: "GETTING_STARTED.md", label: "Getting started", icon: "▶" },
    { slug: "user-guide", file: "USER_GUIDE.md", label: "User guide", icon: "☰" },
  ] },
  { title: "Accounts & data", pages: [
    { slug: "google-sign-in", file: "AUTH.md", label: "Google sign-in", icon: "G" },
    { slug: "google-drive", file: "DRIVE.md", label: "Sync & Google Drive", icon: "☁" },
    { slug: "ai", file: "AI.md", label: "AI", icon: "✦" },
  ] },
  { title: "Platforms", pages: [
    { slug: "web", file: "WEB.md", label: "Web app", icon: "◎" },
    { slug: "releases", file: "RELEASES.md", label: "Downloads & releases", icon: "↓" },
  ] },
  { title: "Developers", pages: [
    { slug: "architecture", file: "ARCHITECTURE.md", label: "Architecture", icon: "▦" },
    { slug: "development", file: "DEVELOPMENT.md", label: "Development", icon: "&lt;/&gt;" },
  ] },
];

const LEGAL = [
  { href: "https://movadesktop.vercel.app/terms", label: "Terms of Use", icon: "§" },
  { href: "https://movadesktop.vercel.app/privacy", label: "Privacy", icon: "◐" },
  { href: "https://movadesktop.vercel.app/licenses", label: "Open-source licences", icon: "©" },
];
const LEGAL_FILES = { "TERMS.md": LEGAL[0].href, "PRIVACY.md": LEGAL[1].href, "THIRD_PARTY_NOTICES.md": LEGAL[2].href };
const ALL = SECTIONS.flatMap((s) => s.pages.map((p) => ({ ...p, section: s.title })));
const bySlug = Object.fromEntries(ALL.map((p) => [p.slug, p]));
const byFile = Object.fromEntries(ALL.map((p) => [p.file, p]));

const slugFromLocation = () => {
  const q = new URLSearchParams(location.search).get("p");
  if (q !== null) return q;
  return location.pathname.replace(/^\//, "").replace(/\/$/, "").replace(/(^|\/)index\.html$/, "");
};
const hrefFor = (slug) => (location.pathname.endsWith(".html") ? `?p=${slug}` : `/${slug}`);

function renderNav(active, filter = "") {
  const f = filter.trim().toLowerCase();
  document.getElementById("nav").innerHTML = SECTIONS.map((s) => {
    const pages = s.pages.filter((p) => !f || p.label.toLowerCase().includes(f) || (window.__index?.[p.slug] ?? "").includes(f));
    if (!pages.length) return "";
    return `<p class="sidebar-heading">${s.title}</p>` + pages.map((p) =>
      `<a class="nav-item ${p.slug === active ? "is-active" : ""}" href="${hrefFor(p.slug)}" data-slug="${p.slug}"><span class="nav-icon">${p.icon}</span><span class="nav-label">${p.label}</span></a>`).join("");
  }).join("") + (f ? "" : `<p class="sidebar-heading">Legal</p>` + LEGAL.map((l) =>
    `<a class="nav-item" href="${l.href}" target="_blank" rel="noreferrer"><span class="nav-icon">${l.icon}</span><span class="nav-label">${l.label}</span></a>`).join(""))
    || `<p class="sidebar-empty">No matches</p>`;
}

const slugify = (t) => t.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-");

function rewriteLinks(root) {
  root.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href");
    if (/^https?:|^#|^mailto:/.test(href)) { if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noreferrer"; } return; }
    const name = href.split("/").pop().split("#")[0];
    const target = byFile[name];
    if (target) a.href = hrefFor(target.slug) + (href.includes("#") ? `#${href.split("#")[1]}` : "");
    else if (LEGAL_FILES[name]) { a.href = LEGAL_FILES[name]; a.target = "_blank"; }
    else a.href = `https://github.com/movainc/movadesktop/blob/main/${href.replace(/^(\.\.\/)+/, "")}`;
  });
  root.querySelectorAll("img[src]").forEach((img) => {
    const src = img.getAttribute("src");
    if (src.includes("screenshots/")) img.src = `/screenshots/${src.split("screenshots/").pop()}`;
    img.loading = "lazy";
  });
}

async function load(slug, push = false) {
  const page = bySlug[slug] ?? bySlug[""];
  if (push) history.pushState({}, "", hrefFor(page.slug));
  renderNav(page.slug, document.getElementById("filter").value);
  document.body.classList.remove("nav-open");
  const el = document.getElementById("page");
  let md;
  try {
    const res = await fetch(`/${page.file}`);
    if (!res.ok) throw new Error();
    md = await res.text();
  } catch {
    el.innerHTML = `<h1>Page not found</h1><p class="quiet">This page couldn't be loaded.</p>`;
    return;
  }
  const titleMatch = md.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1] : page.label;
  const body = titleMatch ? md.replace(titleMatch[0], "") : md;
  el.innerHTML = `<header class="page-header"><p class="eyebrow">${page.section}</p><h1>${marked.parseInline(title)}</h1></header><div class="prose">${marked.parse(body)}</div>`;
  const i = ALL.indexOf(page);
  const prev = ALL[i - 1], next = ALL[i + 1];
  el.insertAdjacentHTML("beforeend", `<footer class="pager">${prev ? `<a class="pager-link" href="${hrefFor(prev.slug)}" data-slug="${prev.slug}"><small>Previous</small>${prev.label}</a>` : "<span></span>"}${next ? `<a class="pager-link pager-next" href="${hrefFor(next.slug)}" data-slug="${next.slug}"><small>Next</small>${next.label}</a>` : ""}</footer>`);
  rewriteLinks(el);

  const heads = [...el.querySelectorAll(".prose h2, .prose h3")];
  heads.forEach((h) => (h.id = slugify(h.textContent)));
  document.getElementById("toc").innerHTML = heads.length > 1
    ? `<p class="section-title">On this page</p>` + heads.map((h) => `<a class="toc-${h.tagName.toLowerCase()}" href="#${h.id}">${h.textContent}</a>`).join("")
    : "";
  document.getElementById("crumbs").innerHTML = `<span>Docs</span><span class="sep">›</span><span>${page.section}</span><span class="sep">›</span><strong>${page.label}</strong>`;
  document.title = `${page.label} — mova docs`;
  if (location.hash) document.getElementById(location.hash.slice(1))?.scrollIntoView();
  else document.querySelector(".main").scrollTo(0, 0);
}

document.addEventListener("click", (e) => {
  const a = e.target.closest("a[data-slug]");
  if (!a || e.metaKey || e.ctrlKey) return;
  e.preventDefault();
  load(a.dataset.slug, true);
});
window.addEventListener("popstate", () => load(slugFromLocation()));

const filter = document.getElementById("filter");
filter.addEventListener("input", () => renderNav(slugFromLocation(), filter.value));
window.addEventListener("keydown", (e) => {
  if (e.key === "/" && document.activeElement !== filter) { e.preventDefault(); filter.focus(); }
  if (e.key === "Escape") filter.blur();
});

load(slugFromLocation());

// Build a tiny full-text index in the background so the sidebar search matches page content too.
window.__index = {};
Promise.all(ALL.map(async (p) => {
  try { window.__index[p.slug] = (await (await fetch(`/${p.file}`)).text()).toLowerCase(); } catch { /* ignore */ }
}));
