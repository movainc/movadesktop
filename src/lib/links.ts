import { isDesktop } from "./ai";

// Tauri's webview doesn't open target="_blank" links, so external links go through the opener plugin.
export async function openExternal(url: string) {
  if (!isDesktop) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }
  const { openUrl } = await import("@tauri-apps/plugin-opener");
  await openUrl(url);
}

export function installExternalLinkHandler() {
  if (!isDesktop) return;
  document.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest?.("a[href]") as HTMLAnchorElement | null;
    if (!a || !/^https?:|^mailto:/.test(a.href)) return;
    e.preventDefault();
    openExternal(a.href);
  });
}

export const WEBSITE_URL = "https://movadesktop.vercel.app";
export const WEB_APP_URL = "https://movadesktopweb.vercel.app";
