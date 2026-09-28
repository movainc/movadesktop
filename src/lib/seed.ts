import { addDays, at, startOfDay } from "./dates";
import type { CalendarEvent, FileItem, FileKind, Folder, LinkItem, Note, Project, Task } from "./types";

export const PROJECT_COLORS = ["#7C6FC4", "#4D4D4D", "#5E7FA8", "#6F9C84", "#C49A5E", "#B8707A"];

export function buildSeed() {
  const today = startOfDay(new Date());
  const d = (n: number) => addDays(today, n);
  const iso = (n: number) => at(d(n), 12);
  const past = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();

  const projects: Project[] = [
    { id: "p-history", name: "History Assignment", description: "Significance of the fall of Singapore, 1942", area: "School", color: "#7C6FC4", deadline: iso(3), starred: true, createdAt: past(400) },
    { id: "p-robotics", name: "Robotics", description: "Autonomous rover — obstacle detection and navigation", area: "Personal", color: "#5E7FA8", deadline: iso(5), starred: true, createdAt: past(900) },
    { id: "p-science", name: "Science Report", description: "Homeostasis practical write-up", area: "School", color: "#6F9C84", deadline: iso(4), starred: false, createdAt: past(300) },
    { id: "p-content", name: "Not My Fault 16x", description: "Resource pack + showcase video", area: "Content", color: "#C49A5E", starred: true, createdAt: past(1200) },
    { id: "p-english", name: "English", description: "Term 3 — persuasive writing unit", area: "School", color: "#B8707A", deadline: iso(9), starred: false, createdAt: past(2000) },
    { id: "p-web", name: "Web Portfolio", description: "Personal site — HTML, CSS and TypeScript", area: "Side projects", color: "#5E7FA8", starred: false, createdAt: past(700) },
    { id: "p-examples", name: "Code Examples", description: "Sample files in different languages to try the editor", area: "Side projects", color: "#7C6FC4", starred: false, createdAt: past(10) },
    { id: "p-pc", name: "PC Build", description: "Parts list, benchmarks and cable management", area: "Personal", color: "#4D4D4D", starred: false, createdAt: past(3000) },
  ];

  const t = (id: string, title: string, extra: Partial<Task> = {}): Task => ({ id, title, done: false, createdAt: past(48), ...extra });
  const tasks: Task[] = [
    t("t17", "Add dark mode to portfolio", { projectId: "p-web", due: iso(8) }),
    t("t18", "Try the code editor on an example file", { projectId: "p-examples" }),
    t("t1", "Finish Singapore significance paragraph", { projectId: "p-history", due: iso(0), scheduledStart: at(d(0), 16), scheduledEnd: at(d(0), 17, 30) }),
    t("t2", "Find two primary sources", { projectId: "p-history", due: iso(1) }),
    t("t3", "Write conclusion", { projectId: "p-history", due: iso(2) }),
    t("t4", "Research Yamashita's campaign", { projectId: "p-history", done: true, completedAt: past(20) }),
    t("t5", "Finish obstacle detection", { projectId: "p-robotics", due: iso(1), scheduledStart: at(d(0), 17, 30), scheduledEnd: at(d(0), 19) }),
    t("t6", "Test turning at low speed", { projectId: "p-robotics", due: iso(3), noteId: "n1" }),
    t("t7", "Upload robotics code", { projectId: "p-robotics", due: iso(0) }),
    t("t8", "Calibrate IR sensors", { projectId: "p-robotics", done: true, completedAt: past(30) }),
    t("t9", "Write method section", { projectId: "p-science", due: iso(2) }),
    t("t10", "Graph results from practical", { projectId: "p-science", due: iso(3) }),
    t("t11", "Edit showcase video", { projectId: "p-content", scheduledStart: at(d(0), 19, 30), scheduledEnd: at(d(0), 21) }),
    t("t12", "Export 16x textures", { projectId: "p-content", done: true, completedAt: past(70) }),
    t("t13", "Draft persuasive speech outline", { projectId: "p-english", due: iso(6) }),
    t("t14", "Organise downloads folder"),
    t("t15", "Reply to James", { due: iso(0) }),
    t("t16", "Compare GPU prices", { projectId: "p-pc" }),
  ];

  const notes: Note[] = [
    { id: "n1", title: "Motor behaviour", projectId: "p-robotics", updatedAt: past(5), body: "Left motor drifts at low PWM.\n\n- Make turning smoother\n- Test IR sensors at 20cm and 40cm\n- Change obstacle threshold to 18cm\n\nIdea: ramp speed instead of hard stops." },
    { id: "n2", title: "Singapore — key arguments", projectId: "p-history", updatedAt: past(3), body: "Why the fall mattered:\n\n1. Largest British surrender in history — shattered the idea of European invincibility.\n2. Accelerated independence movements across Asia.\n3. Australia pivoted towards the US for defence.\n\nNeed a source for point 3." },
    { id: "n3", title: "Sources", projectId: "p-history", updatedAt: past(26), body: "- Churchill, The Second World War vol. IV\n- National Archives of Singapore oral histories\n- Farrell, The Defence and Fall of Singapore" },
    { id: "n4", title: "Homeostasis", projectId: "p-science", updatedAt: past(50), body: "Negative feedback: stimulus → receptor → control centre → effector → response.\n\nPractical: skin temperature after exercise, n = 12." },
    { id: "n5", title: "Video ideas", projectId: "p-content", updatedAt: past(80), body: "Open with before/after split screen.\nKeep it under 4 minutes.\nMusic: something calm, lo-fi." },
    { id: "n6", title: "Random ideas", updatedAt: past(120), body: "A shelf for the desk.\nLearn Rust properly this summer.\nClean up the old Minecraft server." },
  ];

  const events: CalendarEvent[] = [
    { id: "e1", title: "Mathematics", start: at(d(0), 9), end: at(d(0), 10) },
    { id: "e2", title: "English", start: at(d(0), 11, 30), end: at(d(0), 12, 30), projectId: "p-english" },
    { id: "e3", title: "Tennis", start: at(d(1), 15, 30), end: at(d(1), 17) },
    { id: "e4", title: "Science practical", start: at(d(1), 10), end: at(d(1), 11, 30), projectId: "p-science" },
    { id: "e5", title: "Robotics assessment", start: at(d(5), 13), end: at(d(5), 14), projectId: "p-robotics" },
    { id: "e6", title: "History presentation", start: at(d(3), 9), end: at(d(3), 10), projectId: "p-history" },
    { id: "e7", title: "Gym", start: at(d(2), 17, 30), end: at(d(2), 18, 30) },
    { id: "e8", title: "Dinner with family", start: at(d(2), 19), end: at(d(2), 20) },
  ];

  const folders: Folder[] = [
    { id: "root", name: "Home", parentId: null },
    { id: "f-school", name: "School", parentId: "root" },
    { id: "f-english", name: "English", parentId: "f-school" },
    { id: "f-maths", name: "Maths", parentId: "f-school" },
    { id: "f-science", name: "Science", parentId: "f-school" },
    { id: "f-history", name: "History", parentId: "f-school" },
    { id: "f-personal", name: "Personal", parentId: "root" },
    { id: "f-photos", name: "Photos", parentId: "f-personal" },
    { id: "f-projects", name: "Projects", parentId: "f-personal" },
    { id: "f-shared", name: "Shared", parentId: "root" },
    { id: "f-examples", name: "Examples", parentId: "f-projects" },
  ];

  const f = (id: string, name: string, kind: FileItem["kind"], size: number, folderId: string, hoursAgo: number, extra: Partial<FileItem> = {}): FileItem => ({
    id, name, kind, size, folderId, starred: false, updatedAt: past(hoursAgo), ...extra,
  });
  const files: FileItem[] = [
    f("fi1", "Singapore.pdf", "pdf", 2_400_000, "f-history", 4, { projectId: "p-history", starred: true }),
    f("fi2", "WWII-notes.pdf", "pdf", 860_000, "f-history", 30, { projectId: "p-history" }),
    f("fi3", "History presentation.key", "doc", 14_200_000, "f-history", 2, { projectId: "p-history" }),
    f("fi4", "rover.py", "code", ROVER_PY.length, "f-projects", 1, { projectId: "p-robotics", starred: true, content: ROVER_PY }),
    f("fi16", "sensors.py", "code", SENSORS_PY.length, "f-projects", 3, { projectId: "p-robotics", content: SENSORS_PY }),
    f("fi17", "config.json", "code", ROVER_CONFIG.length, "f-projects", 5, { projectId: "p-robotics", content: ROVER_CONFIG }),
    f("fi18", "pack.mcmeta", "code", PACK_MCMETA.length, "f-projects", 90, { projectId: "p-content", content: PACK_MCMETA }),
    f("fi19", "README.md", "doc", PACK_README.length, "f-projects", 95, { projectId: "p-content", content: PACK_README }),
    f("fi5", "course.pdf", "pdf", 1_100_000, "f-projects", 72, { projectId: "p-robotics" }),
    f("fi6", "test-results.csv", "sheet", TEST_CSV.length, "f-projects", 6, { projectId: "p-robotics", content: TEST_CSV }),
    f("fi7", "rover-wiring.jpg", "image", 3_600_000, "f-photos", 20, { projectId: "p-robotics" }),
    f("fi8", "research.pdf", "pdf", 980_000, "f-science", 40, { projectId: "p-science" }),
    f("fi9", "Science report.docx", "doc", 220_000, "f-science", 8, { projectId: "p-science" }),
    f("fi10", "results.xlsx", "sheet", 64_000, "f-science", 9, { projectId: "p-science" }),
    f("fi11", "showcase-v2.mp4", "video", 412_000_000, "f-projects", 26, { projectId: "p-content" }),
    ...EXAMPLES.map(([id, name, projectId, content], i) =>
      f(id, name, kindFromExt(name), content.length, projectId === "p-web" ? "f-projects" : "f-examples", 12 + i * 7, { projectId, content }),
    ),
    f("fi12", "persuasive-rubric.pdf", "pdf", 310_000, "f-english", 100, { projectId: "p-english" }),
    f("fi13", "algebra-worksheet.jpg", "image", 1_800_000, "f-maths", 50),
    f("fi14", "parts-list.xlsx", "sheet", 28_000, "f-projects", 200, { projectId: "p-pc" }),
    f("fi15", "Group assignment brief.pdf", "pdf", 540_000, "f-shared", 60),
  ];

  const links: LinkItem[] = [
    { id: "l1", title: "Micromelon documentation", url: "https://micromelon.com.au", projectId: "p-robotics" },
    { id: "l2", title: "National Archives of Singapore", url: "https://www.nas.gov.sg", projectId: "p-history" },
  ];

  return { projects, tasks, notes, events, folders, files, links };
}

const ROVER_PY = `"""Autonomous rover — obstacle detection and navigation."""
from dataclasses import dataclass
import time

from sensors import IRArray

OBSTACLE_THRESHOLD_CM = 18
CRUISE_SPEED = 45
TURN_SPEED = 30


@dataclass
class Motors:
    left: int = 0
    right: int = 0

    def drive(self, left: int, right: int) -> None:
        self.left, self.right = left, right

    def stop(self) -> None:
        self.drive(0, 0)


class Rover:
    def __init__(self) -> None:
        self.motors = Motors()
        self.ir = IRArray(pins=(4, 5, 6))

    def ramp_to(self, target: int, steps: int = 5) -> None:
        # Ramp speed instead of hard stops — the left motor drifts at low PWM.
        start = self.motors.left
        for i in range(1, steps + 1):
            speed = start + (target - start) * i // steps
            self.motors.drive(speed, speed)
            time.sleep(0.05)

    def avoid(self) -> None:
        left, centre, right = self.ir.read_cm()
        if centre > OBSTACLE_THRESHOLD_CM:
            return
        turn = TURN_SPEED if left > right else -TURN_SPEED
        self.motors.drive(-turn, turn)
        time.sleep(0.4)

    def run(self) -> None:
        self.ramp_to(CRUISE_SPEED)
        while True:
            self.avoid()
            time.sleep(0.02)


if __name__ == "__main__":
    Rover().run()
`;

const SENSORS_PY = `"""IR distance sensor array."""


class IRArray:
    def __init__(self, pins: tuple[int, int, int]) -> None:
        self.pins = pins

    def read_raw(self) -> list[int]:
        # TODO: replace with real ADC reads
        return [512, 512, 512]

    def read_cm(self) -> tuple[float, float, float]:
        return tuple(self._to_cm(v) for v in self.read_raw())

    @staticmethod
    def _to_cm(raw: int) -> float:
        # Calibrated at 20cm and 40cm — see "Motor behaviour" note.
        return max(4.0, 6787 / (raw - 3) - 4)
`;

const ROVER_CONFIG = `{
  "name": "rover",
  "obstacleThresholdCm": 18,
  "speeds": { "cruise": 45, "turn": 30 },
  "sensors": { "ir": [4, 5, 6] }
}
`;

const TEST_CSV = `run,speed,threshold_cm,collisions,lap_time_s
1,40,15,2,48.1
2,45,15,1,44.6
3,45,18,0,45.2
4,50,18,1,41.9
`;

const PACK_MCMETA = `{
  "pack": {
    "pack_format": 34,
    "description": "Not My Fault 16x"
  }
}
`;

const PACK_README = `# Not My Fault 16x

A clean 16x resource pack.

## To do
- Finish ore textures
- Record the showcase video
`;

const kindFromExt = (name: string): FileKind => (/\.(md|txt)$/i.test(name) ? "doc" : "code");

const EXAMPLES: [string, string, string, string][] = [
  ["ex1", "index.html", "p-web", `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Portfolio</title>
    <link rel="stylesheet" href="styles.css" />
  </head>
  <body>
    <header class="hero">
      <h1>Hi, I build things.</h1>
      <p>Robotics, games and the occasional website.</p>
      <button id="theme-toggle" aria-pressed="false">Toggle theme</button>
    </header>
    <main id="projects"></main>
    <script type="module" src="main.js"></script>
  </body>
</html>
`],
  ["ex2", "styles.css", "p-web", `:root {
  --bg: #ffffff;
  --text: #171717;
  --accent: #7c6fc4;
}

[data-theme="dark"] {
  --bg: #111111;
  --text: #ededed;
}

body {
  margin: 0;
  font: 16px/1.6 Inter, system-ui, sans-serif;
  background: var(--bg);
  color: var(--text);
}

.hero {
  padding: 96px 24px;
  max-width: 720px;
  margin: 0 auto;
}

.hero h1 {
  font-size: clamp(2rem, 5vw, 3.5rem);
  letter-spacing: -0.03em;
}

button {
  border: 1px solid var(--accent);
  border-radius: 999px;
  padding: 8px 16px;
  background: transparent;
  color: var(--accent);
  cursor: pointer;
}
`],
  ["ex3", "main.ts", "p-web", `interface Project {
  name: string;
  description: string;
  tags: string[];
  url?: string;
}

const projects: Project[] = [
  { name: "Rover", description: "Autonomous obstacle-avoiding robot", tags: ["python", "robotics"] },
  { name: "Not My Fault 16x", description: "Minecraft resource pack", tags: ["art"], url: "https://example.com" },
];

function render(list: Project[]): string {
  return list
    .map((p) => \`<article><h2>\${p.name}</h2><p>\${p.description}</p><small>\${p.tags.join(" · ")}</small></article>\`)
    .join("");
}

const root = document.querySelector<HTMLElement>("#projects");
if (root) root.innerHTML = render(projects);

const toggle = document.querySelector<HTMLButtonElement>("#theme-toggle");
toggle?.addEventListener("click", () => {
  const dark = document.documentElement.dataset.theme !== "dark";
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  toggle.setAttribute("aria-pressed", String(dark));
});
`],
  ["ex4", "main.rs", "p-examples", `use std::collections::HashMap;

/// Counts how often each word appears in a piece of text.
fn word_counts(text: &str) -> HashMap<String, usize> {
    let mut counts = HashMap::new();
    for word in text.split_whitespace() {
        let word = word.trim_matches(|c: char| !c.is_alphanumeric()).to_lowercase();
        if !word.is_empty() {
            *counts.entry(word).or_insert(0) += 1;
        }
    }
    counts
}

fn main() {
    let text = "Capture first. Organise later. Capture everything.";
    let mut counts: Vec<_> = word_counts(text).into_iter().collect();
    counts.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));

    for (word, n) in counts {
        println!("{word:>10}  {n}");
    }
}
`],
  ["ex5", "schema.sql", "p-examples", `-- A minimal schema for projects and tasks
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  area        TEXT NOT NULL DEFAULT 'Personal',
  deadline    DATE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tasks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id  UUID REFERENCES projects(id) ON DELETE SET NULL,
  title       TEXT NOT NULL,
  done        BOOLEAN NOT NULL DEFAULT false,
  due         DATE
);

-- Open tasks due this week, grouped by project
SELECT p.name, COUNT(*) AS open_tasks
FROM tasks t
JOIN projects p ON p.id = t.project_id
WHERE NOT t.done
  AND t.due BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
GROUP BY p.name
ORDER BY open_tasks DESC;
`],
  ["ex6", "timer.js", "p-examples", `// A tiny focus timer
export class FocusTimer {
  #remaining;
  #interval = null;

  constructor(minutes = 25, onTick = () => {}) {
    this.#remaining = minutes * 60;
    this.onTick = onTick;
  }

  start() {
    if (this.#interval) return;
    this.#interval = setInterval(() => {
      this.#remaining = Math.max(0, this.#remaining - 1);
      this.onTick(this.format());
      if (this.#remaining === 0) this.stop();
    }, 1000);
  }

  stop() {
    clearInterval(this.#interval);
    this.#interval = null;
  }

  format() {
    const m = String(Math.floor(this.#remaining / 60)).padStart(2, "0");
    const s = String(this.#remaining % 60).padStart(2, "0");
    return \`\${m}:\${s}\`;
  }
}
`],
  ["ex7", "server.go", "p-examples", `package main

import (
	"encoding/json"
	"log"
	"net/http"
)

type Task struct {
	ID    int    \`json:"id"\`
	Title string \`json:"title"\`
	Done  bool   \`json:"done"\`
}

func main() {
	tasks := []Task{{1, "Finish history paragraph", false}, {2, "Test rover turning", true}}

	http.HandleFunc("/tasks", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(tasks)
	})

	log.Println("listening on :8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
`],
  ["ex8", "workflow.yml", "p-examples", `name: build
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npm run typecheck
      - run: npm run build
`],
  ["ex9", "welcome.md", "p-examples", `# Welcome to the mova editor

This editor is powered by **Monaco**, the open-source core of *Code - OSS* (VS Code).

## Try it
- Open any file from the explorer on the left
- Edits save automatically
- \`Ctrl/⌘ F\` to find, \`Ctrl/⌘ H\` to replace
- \`Alt\` + click for multiple cursors

| Language   | File          |
|------------|---------------|
| Python     | rover.py      |
| TypeScript | main.ts       |
| Rust       | main.rs       |
| SQL        | schema.sql    |
| Go         | server.go     |

> Tip: select a block and press \`Tab\` to indent it.
`],
];
