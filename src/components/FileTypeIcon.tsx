const icons = import.meta.glob<string>("../assets/file-icons/*.svg", { eager: true, query: "?url", import: "default" });
const url = (name: string) => icons[`../assets/file-icons/${name}.svg`];

const BY_EXT: Record<string, string> = {
  py: "python", ts: "typescript", tsx: "react_ts", js: "javascript", mjs: "javascript", cjs: "javascript", jsx: "react",
  rs: "rust", go: "go", sql: "database", html: "html", htm: "html", css: "css", scss: "sass", sass: "sass",
  json: "json", mcmeta: "json", md: "markdown", yml: "yaml", yaml: "yaml", toml: "toml", xml: "xml",
  c: "c", h: "c", cpp: "cpp", cc: "cpp", hpp: "cpp", cs: "csharp", java: "java", sh: "console", bash: "console", zsh: "console",
  pdf: "pdf", png: "image", jpg: "image", jpeg: "image", gif: "image", webp: "image", svg: "image", heic: "image",
  mp4: "video", mov: "video", mkv: "video", webm: "video", mp3: "audio", wav: "audio", flac: "audio", m4a: "audio",
  csv: "table", xls: "table", xlsx: "table", numbers: "table", doc: "word", docx: "word", pages: "word", rtf: "word",
  txt: "document", ppt: "powerpoint", pptx: "powerpoint", key: "powerpoint",
  zip: "zip", rar: "zip", "7z": "zip", tar: "zip", gz: "zip", ini: "settings", env: "settings", cfg: "settings", conf: "settings",
};

export function iconNameFor(fileName: string) {
  return BY_EXT[fileName.split(".").pop()?.toLowerCase() ?? ""] ?? "file";
}

export function FileTypeIcon({ name, size = 16 }: { name: string; size?: number }) {
  return <img className="file-type-icon" src={url(iconNameFor(name))} width={size} height={size} alt="" draggable={false} />;
}
