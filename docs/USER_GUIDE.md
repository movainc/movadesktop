# mova user guide

mova is organised around **projects**. Everything you add (a task, a note, a file, an event, a link) can belong to a project, and you can find it again from anywhere with search.

## The sidebar

| Item | What it's for |
|---|---|
| Search | Search everything (`Ctrl/⌘ K`) |
| Today | Your day at a glance |
| Tasks | Every task across all projects |
| Projects | All projects, grouped by area |
| Calendar | Your week, with time for tasks |
| Notes | Everything you've written |
| Files | Your file library |
| Code | The code editor |
| Starred / Recent / Shared | Quick file views |
| Projects list | Your starred projects (click **+** to create one) |
| Assistant | The optional AI helper (`Ctrl/⌘ J`) |
| Settings | Theme, AI, shortcuts, legal and credits |

Collapse the sidebar with the panel button or `Ctrl/⌘ \`.

## Today

- **Today timeline.** It shows the day's events and scheduled tasks in time order. A violet line marks *now*; past items fade, and the current one is highlighted.
- **Tasks.** Anything due today or overdue, plus loose tasks without a project. Add one with *Add a task for today*.
- **Focus card.** It suggests the next thing to work on. Press **Start** to enter Focus mode.
- **Due soon.** Project deadlines (in bold) and tasks due in the next seven days.
- **Recent.** Projects, notes and files you've opened lately.

## Projects

Create a project with **New project**. Give it a name, an optional description, an area (School, Work, Personal, Content, Side projects), a deadline and a colour.

Inside a project:

- **Overview**: tasks, what's coming up, notes, files and links on one screen.
- **Tasks**: open tasks, with completed ones tucked away.
- **Notes**: note cards. **New note** opens the editor.
- **Files**: drop files onto the page, or press **Upload files**.
- **Calendar**: the deadline, events and scheduled tasks for this project.
- **Links**: paste a URL to save documentation or sources.

Edit the name and description by clicking on them. Star a project to pin it to the sidebar. **Focus** starts Focus mode on the project's next task.

## Tasks

- Filter by **Today**, **Upcoming**, **All** (grouped by project), **No project** or **Completed**.
- Type in *Add a task*; a project picker and due date appear as you type. Press Enter to add it.
- Click a task to open its **detail panel**. You can rename it, change the project or due date, schedule it for a time, jump to the note it came from, focus on it, or delete it.
- **Break into steps** (AI, optional) suggests 3–5 smaller tasks. You choose which ones to add.

## Calendar

- The week runs from Monday to Sunday. Use the arrows or **Today** to move between weeks.
- **Unscheduled** tasks are listed on the left. Drag one onto a time slot to schedule it (one hour by default).
- Drag a scheduled task block to move it. Click it to open its project.
- **Double-click** an empty slot, or press **New event**, to add an event.
- Deadlines and due tasks appear at the top of each day.

## Notes

- Notes are plain text. Just write.
- Assign a note to a project from the bar at the top.
- **Turn into task.** Select any text, then press the button that appears. The task links back to the note and is listed under *Tasks from this note*.
- **Suggest tasks from this note** (AI, optional) proposes next actions to add.

## Files

- Browse folders on the left. The breadcrumb shows where you are.
- **Upload**, or drag files anywhere onto the page.
- Click a file to see its details, assign it to a project, star it, delete it, or (for text and code files) **Open in editor**.
- **Starred**, **Recent** and **Shared** in the sidebar are shortcuts.

> In this version, files are catalogued on your device. Contents are kept for text and code files up to 1 MB so you can edit them. Cloud storage and sync arrive with mova accounts.

## Code

The Code view is a full editor built on **Monaco**, the open-source editor at the heart of **Code - OSS (VS Code)**.

- The **Explorer** groups text and code files by project. The page icon at the top creates a new file.
- **Tabs** let you keep several files open.
- Syntax highlighting is picked automatically from the file extension (Python, TypeScript, JavaScript, Rust, Go, SQL, HTML, CSS, JSON, YAML, Markdown and more).
- Changes **save automatically**. The status bar shows *Saving…* and then *Saved*, along with the line, column and language.
- The usual editor shortcuts work: `Ctrl/⌘ F` find, `Ctrl/⌘ H` replace, `Alt`-click for multiple cursors, `Ctrl/⌘ /` to toggle comments, `Alt ↑/↓` to move lines.
- mova's own shortcuts (`Ctrl/⌘ K`, `Ctrl/⌘ J`, `Ctrl/⌘ ⇧ F`) keep working inside the editor.

The **Web Portfolio** and **Code Examples** projects contain sample files to explore.

## Focus mode

Focus hides everything except one task and a timer.

- Choose **25**, **50** or **90** minutes, then **Start**. `Space` starts and pauses.
- **Mark done** completes the task and moves to the next one in the project. ⏭ skips to it without completing.
- `Esc` exits.

## Search

Press `Ctrl/⌘ K`. With an empty box you get quick actions (new note, new project, start focus) and navigation. Type to search projects, tasks, notes, files and events. Matching a project name also shows everything inside it. Use `↑ ↓` to move and `Enter` to open.

## Assistant

See [AI.md](AI.md). Open it with `Ctrl/⌘ J` or **Assistant** in the sidebar. Ask things like *"What should I work on next?"* or *"Plan the rest of my day"*.

## Settings

- **Appearance**: System, Light or Dark.
- **AI**: turn AI on or off, add an API key, choose the model.
- **Keyboard**: a list of shortcuts.
- **Workspace**: reset the sample workspace.
- **Legal & credits**: open-source attributions.

## Keyboard shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl/⌘ K` | Search |
| `Ctrl/⌘ J` | Assistant |
| `Ctrl/⌘ 1`–`7` | Today, Tasks, Projects, Calendar, Notes, Files, Code |
| `Ctrl/⌘ ⇧ F` | Enter or leave Focus |
| `Ctrl/⌘ \` | Collapse the sidebar |
| `Ctrl/⌘ [` | Back |
| `Esc` | Close a dialog, panel or Focus |

## Your data

Your workspace is saved on this device automatically. **Settings → Workspace → Reset** restores the sample workspace, and **it replaces your data**.
