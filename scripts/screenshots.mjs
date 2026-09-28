// Captures README/website screenshots from a production build:
//   npm run build && npx vite preview --port 4174     (in one terminal)
//   npm run screenshots                                (in another)
// A test account and the demo workspace in scripts/demo/ are injected; the app itself ships empty.
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";
import { buildDemo } from "./demo/workspace.ts";

const APP_URL = process.env.MOVA_URL ?? "http://localhost:4174";
const OUT = new URL("../docs/screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const TEST_ACCOUNT = { id: "test-user", provider: "test", name: "Alex Rivera", email: "alex@test.mova.app" };
const session = (theme = "light") => JSON.stringify({ state: { account: TEST_ACCOUNT, theme, cloudSync: false }, version: 1 });
const workspace = (data, extra = {}) =>
  JSON.stringify({ state: { ...data, view: { name: "today" }, recent: [], onboarded: true, sidebarCollapsed: false, aiEnabled: true, ...extra }, version: 1 });

const demo = buildDemo();
const recent = [
  { kind: "project", id: "p-history", at: new Date().toISOString() },
  { kind: "project", id: "p-robotics", at: new Date(Date.now() - 36e5).toISOString() },
  { kind: "note", id: "n2", at: new Date(Date.now() - 72e5).toISOString() },
  { kind: "file", id: "fi3", at: new Date(Date.now() - 9e6).toISOString() },
];
const empty = { projects: [], tasks: [], notes: [], events: [], files: [], links: [], folders: [{ id: "root", name: "Home", parentId: null }, { id: "f-shared", name: "Shared", parentId: "root" }] };

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const errors = [];

async function newPage(storage) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  if (storage) await context.addInitScript((items) => { for (const [k, v] of Object.entries(items)) localStorage.setItem(k, v); }, storage);
  const page = await context.newPage();
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(APP_URL);
  await page.waitForTimeout(700);
  return page;
}

const shot = async (page, name) => { await page.waitForTimeout(350); await page.screenshot({ path: `${OUT}${name}.png` }); console.log("saved", name); };
const nav = async (page, label) => { await page.click(`.sidebar .nav-item:has-text("${label}")`); await page.waitForTimeout(350); };

// Sign-in screen (signed out)
{
  const page = await newPage();
  await shot(page, "signin");
  await page.context().close();
}

// First run for a new account: empty workspace + tour
{
  const page = await newPage({ "mova-session": session(), "mova-workspace:test-user": workspace(empty, { onboarded: false }) });
  await shot(page, "tour-welcome");
  await page.click('.tour button:has-text("Start the tour")');
  await page.waitForTimeout(500);
  await shot(page, "tour-step");
  await page.click('.tour button[aria-label="End tour"]');
  await nav(page, "Today");
  await shot(page, "empty-today");
  await page.context().close();
}

// Full workspace
{
  const page = await newPage({ "mova-session": session(), "mova-workspace:test-user": workspace(demo, { recent }) });
  await shot(page, "today");
  await page.click(".account-trigger"); await shot(page, "account-menu"); await page.keyboard.press("Escape");
  await nav(page, "Projects"); await shot(page, "projects");
  await page.click('.project-card:has-text("Robotics")'); await shot(page, "project");
  await nav(page, "Tasks"); await page.click('.task-row:has-text("Test turning")'); await shot(page, "tasks");
  await nav(page, "Calendar"); await shot(page, "calendar");
  await nav(page, "Notes"); await page.click('.notes-list li:has-text("Singapore")'); await shot(page, "notes");
  await nav(page, "Files"); await page.click('.folder-card:has-text("Personal")'); await page.click('.folder-card:has-text("Projects")'); await page.click('.file-row:has-text("rover.py") .file-name'); await shot(page, "files");
  await nav(page, "Code"); await page.waitForSelector(".monaco-editor", { timeout: 20000 }); await page.waitForTimeout(800); await shot(page, "code");
  for (const [file, name] of [["main.ts", "code-typescript"], ["main.rs", "code-rust"], ["schema.sql", "code-sql"], ["welcome.md", "code-markdown"]]) {
    await page.click(`.code-file:has-text("${file}")`); await page.waitForTimeout(700); await shot(page, name);
  }
  await page.keyboard.press("Control+k"); await page.keyboard.type("robot"); await shot(page, "search");
  await page.keyboard.press("Escape");
  await nav(page, "Today");
  await nav(page, "Settings"); await shot(page, "settings");
  await nav(page, "Today"); await page.keyboard.press("Control+Shift+F"); await shot(page, "focus");
  await page.keyboard.press("Escape");
  await page.context().close();
}

// Dark theme
{
  const page = await newPage({ "mova-session": session("dark"), "mova-workspace:test-user": workspace(demo, { recent }) });
  await shot(page, "today-dark");
  await nav(page, "Code"); await page.waitForSelector(".monaco-editor", { timeout: 20000 }); await page.waitForTimeout(800); await shot(page, "code-dark");
  await page.context().close();
}

await browser.close();
if (errors.length) { console.error("Page errors:", errors); process.exit(1); }
