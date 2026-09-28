import * as monaco from "monaco-editor";
import { loader } from "@monaco-editor/react";
import EditorWorker from "monaco-editor/editor/editor.worker?worker";
import JsonWorker from "monaco-editor/language/json/json.worker?worker";
import CssWorker from "monaco-editor/language/css/css.worker?worker";
import HtmlWorker from "monaco-editor/language/html/html.worker?worker";
import TsWorker from "monaco-editor/language/typescript/ts.worker?worker";

// Bundle Monaco locally (no CDN) so the editor works offline inside the desktop app.
self.MonacoEnvironment = {
  getWorker(_id: string, label: string) {
    if (label === "json") return new JsonWorker();
    if (label === "css" || label === "scss" || label === "less") return new CssWorker();
    if (label === "html" || label === "handlebars" || label === "razor") return new HtmlWorker();
    if (label === "typescript" || label === "javascript") return new TsWorker();
    return new EditorWorker();
  },
};

loader.config({ monaco });

monaco.editor.defineTheme("mova-light", {
  base: "vs",
  inherit: true,
  rules: [
    { token: "comment", foreground: "8A8A8A", fontStyle: "italic" },
    { token: "keyword", foreground: "6E61B8" },
    { token: "string", foreground: "4F8A5B" },
    { token: "number", foreground: "B8707A" },
    { token: "type", foreground: "5E7FA8" },
  ],
  colors: {
    "editor.background": "#FFFFFF",
    "editor.foreground": "#171717",
    "editorLineNumber.foreground": "#B5B5B5",
    "editorLineNumber.activeForeground": "#4D4D4D",
    "editor.lineHighlightBackground": "#F7F7F7",
    "editor.selectionBackground": "#E4E0F6",
    "editorCursor.foreground": "#7C6FC4",
    "editorIndentGuide.background1": "#EEEEEE",
    "editorWidget.background": "#FFFFFF",
    "editorWidget.border": "#E8E8E8",
  },
});

monaco.editor.defineTheme("mova-dark", {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "comment", foreground: "7A7A7A", fontStyle: "italic" },
    { token: "keyword", foreground: "B3AAEB" },
    { token: "string", foreground: "8FC29E" },
    { token: "number", foreground: "E0A0A8" },
    { token: "type", foreground: "8FB0D8" },
  ],
  colors: {
    "editor.background": "#111111",
    "editor.foreground": "#EDEDED",
    "editorLineNumber.foreground": "#525252",
    "editorLineNumber.activeForeground": "#B3B3B3",
    "editor.lineHighlightBackground": "#171717",
    "editor.selectionBackground": "#3A3456",
    "editorCursor.foreground": "#8F83D6",
    "editorIndentGuide.background1": "#222222",
    "editorWidget.background": "#171717",
    "editorWidget.border": "#262626",
  },
});

const LANGS: Record<string, string> = {
  py: "python", ts: "typescript", tsx: "typescript", js: "javascript", jsx: "javascript", json: "json", mcmeta: "json",
  md: "markdown", html: "html", css: "css", scss: "scss", rs: "rust", go: "go", java: "java", c: "c", h: "c",
  cpp: "cpp", cs: "csharp", sh: "shell", yml: "yaml", yaml: "yaml", toml: "ini", sql: "sql", csv: "plaintext", txt: "plaintext", xml: "xml",
};

export const languageFor = (name: string) => LANGS[name.split(".").pop()?.toLowerCase() ?? ""] ?? "plaintext";

export const LANGUAGE_LABELS: Record<string, string> = {
  python: "Python", typescript: "TypeScript", javascript: "JavaScript", json: "JSON", markdown: "Markdown", html: "HTML",
  css: "CSS", scss: "SCSS", rust: "Rust", go: "Go", java: "Java", c: "C", cpp: "C++", csharp: "C#", shell: "Shell",
  yaml: "YAML", ini: "TOML", sql: "SQL", plaintext: "Plain text", xml: "XML",
};
