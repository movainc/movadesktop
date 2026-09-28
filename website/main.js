// Points the download buttons at the latest GitHub Release and highlights the visitor's platform.
const REPO = "movainc/movadesktop";

const MATCHERS = {
  mac: /aarch64\.dmg$/i,
  windows: /x64-setup\.exe$/i,
  "windows-msi": /x64.*\.msi$/i,
  linux: /amd64\.AppImage$/i,
  "linux-deb": /amd64\.deb$/i,
};

function detectOs() {
  const ua = navigator.userAgent;
  const platform = navigator.userAgentData?.platform ?? navigator.platform ?? "";
  if (/Mac/i.test(platform) || /Macintosh/.test(ua)) return "mac";
  if (/Win/i.test(platform) || /Windows/.test(ua)) return "windows";
  if (/Linux/i.test(platform) && !/Android/i.test(ua)) return "linux";
  return null;
}

const LABELS = { mac: "Download for macOS", windows: "Download for Windows", linux: "Download for Linux" };

function highlightPlatform() {
  const os = detectOs();
  if (!os) return;
  document.querySelector(`.dl[data-os="${os}"]`)?.classList.add("is-yours");
  const hero = document.getElementById("hero-download");
  if (hero) hero.textContent = LABELS[os];
}

async function wireRelease() {
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } });
    if (!res.ok) throw new Error(String(res.status));
    const release = await res.json();
    const assets = release.assets ?? [];
    for (const [key, re] of Object.entries(MATCHERS)) {
      const asset = assets.find((a) => re.test(a.name));
      document.querySelectorAll(`[data-asset="${key}"]`).forEach((el) => {
        if (!asset) return;
        el.href = asset.browser_download_url;
        el.hidden = false;
      });
    }
    const os = detectOs();
    const heroAsset = os && assets.find((a) => MATCHERS[os].test(a.name));
    const hero = document.getElementById("hero-download");
    if (heroAsset && hero) hero.href = heroAsset.browser_download_url;
    const date = new Date(release.published_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
    const line = document.getElementById("release-line");
    if (line) line.textContent = `Version ${release.tag_name.replace(/^v/, "")} · released ${date}. Free for macOS, Windows and Linux — or use it in your browser.`;
  } catch {
    // No public release yet: buttons keep pointing at the releases page.
  }
}

highlightPlatform();
wireRelease();

// Changelog page: list every published release (GitHub renders the notes to HTML).
async function renderChangelog() {
  const list = document.getElementById("releases");
  if (!list) return;
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=20`, { headers: { Accept: "application/vnd.github.html+json" } });
    if (!res.ok) return;
    const releases = (await res.json()).filter((r) => !r.draft);
    if (!releases.length) return;
    list.innerHTML = releases.map((r) => {
      const date = new Date(r.published_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" });
      const assets = (r.assets ?? []).map((a) => `<a href="${a.browser_download_url}">${a.name}</a>`).join("");
      return `<article class="release"><header><h2>${r.name || r.tag_name}</h2><span class="fine">${date}${r.prerelease ? " · pre-release" : ""}</span></header><div class="release-body">${r.body_html || ""}</div>${assets ? `<div class="release-assets">${assets}</div>` : ""}</article>`;
    }).join("");
  } catch {
    // Keep the built-in notes.
  }
}
renderChangelog();
