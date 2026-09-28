// Captures the README screenshots from a running build: `npm run build && npx vite preview --port 4174`, then `node scripts/screenshots.mjs`.
import { mkdirSync } from "node:fs";
import { chromium } from "playwright";

const APP_URL = process.env.MOVA_URL ?? "http://localhost:4174";
const OUT = new URL("../docs/screenshots/", import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

const nav = async (label) => { await page.click(`.sidebar .nav-item:has-text("${label}")`); await page.waitForTimeout(350); };
const shot = async (name) => { await page.waitForTimeout(300); await page.screenshot({ path: `${OUT}${name}.png` }); console.log("saved", name); };
const theme = async (t) => { await nav("Settings"); await page.click(`.theme-option:has-text("${t === "dark" ? "Dark" : "Light"}")`); };

await page.goto(APP_URL);
await theme("light");
await nav("Today");
await page.waitForTimeout(500);
await shot("today");
await nav("Projects"); await shot("projects");
await page.click('.project-card:has-text("Robotics")'); await shot("project");
await nav("Tasks"); await page.click('.task-row:has-text("Test turning")'); await shot("tasks");
await nav("Calendar"); await shot("calendar");
await nav("Notes"); await page.click('.notes-list li:has-text("Singapore")'); await shot("notes");
await nav("Files"); await page.click('.folder-card:has-text("Personal")'); await page.click('.folder-card:has-text("Projects")'); await page.click('.file-row:has-text("rover.py") .file-name'); await shot("files");
await nav("Code"); await page.waitForSelector(".monaco-editor", { timeout: 20000 }); await page.waitForTimeout(800); await shot("code");
for (const [file, name] of [["main.ts", "code-typescript"], ["main.rs", "code-rust"], ["schema.sql", "code-sql"], ["welcome.md", "code-markdown"]]) {
  await page.click(`.code-file:has-text("${file}")`); await page.waitForTimeout(700); await shot(name);
}
await page.click('.code-file:has-text("rover.py")'); await page.waitForTimeout(500);
await page.keyboard.press("Control+k"); await page.keyboard.type("robot"); await shot("search");
await page.keyboard.press("Escape");
await nav("Today");
await nav("Assistant"); await shot("assistant");
await nav("Assistant");
await nav("Settings"); await shot("settings");
await nav("Today"); await page.keyboard.press("Control+Shift+F"); await shot("focus");
await page.keyboard.press("Escape");
await theme("dark");
await nav("Today"); await shot("today-dark");
await nav("Code"); await page.waitForTimeout(800); await shot("code-dark");

await browser.close();
if (errors.length) { console.error("Page errors:", errors); process.exit(1); }
