# AI in mova

AI in mova is **desktop only, optional, small and suggestion-only**. It helps you decide and get started. The real work, like writing the essay, building the robot or solving the problem, stays with you.

## What it does

| Feature | Where | What happens |
|---|---|---|
| **Assistant** | Sidebar → Assistant, or `Ctrl/⌘ J` | Answers short questions about your day using your schedule, open tasks and deadlines: "What should I work on next?", "Plan the rest of my day", "What's due this week?" |
| **Suggest tasks from a note** | Notes → *Suggest tasks from this note* | Proposes 3–5 next actions from the note. Tick the ones you want and press **Add** |
| **Break into steps** | Task detail panel → *Break into steps* | Splits one task into 3–5 smaller steps. You choose which to add |

Nothing is created or changed without you pressing a button. The assistant is instructed never to claim it changed anything, and not to write assignments or large pieces of work. It offers an outline, a first step or a question instead.

## What it doesn't do

- It doesn't read your files or code.
- It doesn't run in the background or on a schedule.
- It doesn't send your whole workspace. The assistant receives only today's schedule, up to 40 open task titles with their project and due date, and project deadlines. Note suggestions send the one note (first 4,000 characters). Break-into-steps sends one task title and its project name.

## Model and limits

- The default model is **`gpt-6-luna`**, which you can change in **Settings → AI → Model**.
- Requests go to the OpenAI Chat Completions endpoint.
- Replies are capped at **600 tokens**. The assistant uses 350, and suggestions use 200. That keeps each call small and cheap.
- The assistant sends at most the last 10 messages of the conversation.

## API key

AI needs an OpenAI API key. mova looks for one in this order:

1. The **`MOVA_OPENAI_API_KEY`** environment variable, for development or managed installs.
2. A key saved in **Settings → AI**.

How the key is handled:

- Only the Rust native layer (`src-tauri/src/ai.rs`) reads the key and makes requests. The web UI never sees it.
- A key saved in Settings is written to `ai.json` in mova's app config folder (`0600` permissions on macOS/Linux). It is not stored in the workspace data and is never synced.
- **Remove saved key** in Settings deletes it.

> **Never commit an API key to this repository**, and don't ship one inside the app binary. Anything in a distributed app can be extracted. For a hosted "no setup" experience, route AI through the mova backend, which holds the key server-side, and give the desktop app a user session instead.

## Turning it off

Toggle **Settings → AI → AI assistance** off. The Assistant, suggestion buttons and `Ctrl/⌘ J` disappear, and no AI requests are made.

## Web app

The web app doesn't include AI. It only runs through the desktop app's native layer, so keys never sit in a web page.

## Development

Put `MOVA_OPENAI_API_KEY` in `.env.local` (see `.env.example`). `npm run tauri dev` loads it at runtime in debug builds.
