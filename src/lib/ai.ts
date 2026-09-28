import { invoke } from "@tauri-apps/api/core";
import { useStore } from "./store";
import { dueLabel, fmtDate, fmtTime, isSameDay } from "./dates";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
export type AiStatus = { configured: boolean; model: string; from_env: boolean };

export const isDesktop = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

const DESKTOP_ONLY = "AI features run in the mova desktop app.";

export async function aiStatus(): Promise<AiStatus | null> {
  if (!isDesktop) return null;
  return invoke<AiStatus>("ai_status");
}

export async function aiConfigure(apiKey?: string, model?: string): Promise<AiStatus> {
  if (!isDesktop) throw new Error(DESKTOP_ONLY);
  return invoke<AiStatus>("ai_configure", { apiKey, model });
}

export async function aiForgetKey(): Promise<AiStatus> {
  if (!isDesktop) throw new Error(DESKTOP_ONLY);
  return invoke<AiStatus>("ai_forget_key");
}

export async function aiComplete(messages: ChatMessage[], maxTokens = 400): Promise<string> {
  if (!isDesktop) throw new Error(DESKTOP_ONLY);
  return invoke<string>("ai_complete", { messages, maxTokens });
}

const LIST_RULES = "Reply with one item per line. No numbering, bullets, headings or extra commentary. Each item under 10 words, starting with a verb.";

function parseList(text: string, max: number) {
  return text
    .split("\n")
    .map((l) => l.replace(/^\s*(?:[-*•]|\d+[.)])\s*/, "").replace(/\*\*/g, "").trim())
    .filter((l) => l.length > 1 && l.length < 140)
    .slice(0, max);
}

export async function suggestTasksFromNote(title: string, body: string): Promise<string[]> {
  const text = await aiComplete(
    [
      { role: "system", content: `You turn a student's or worker's note into a short list of concrete next actions. Suggest 3 to 5 tasks. ${LIST_RULES}` },
      { role: "user", content: `Note title: ${title || "Untitled"}\n\n${body.slice(0, 4000)}` },
    ],
    200,
  );
  return parseList(text, 5);
}

export async function breakDownTask(task: string, project?: string): Promise<string[]> {
  const text = await aiComplete(
    [
      { role: "system", content: `You break one task into 3 to 5 small, doable steps that together complete it. ${LIST_RULES}` },
      { role: "user", content: `Task: ${task}${project ? `\nProject: ${project}` : ""}` },
    ],
    200,
  );
  return parseList(text, 5);
}

export function workspaceContext(): string {
  const { tasks, projects, events } = useStore.getState();
  const now = new Date();
  const pname = (id?: string) => projects.find((p) => p.id === id)?.name;
  const today = [
    ...events.filter((e) => isSameDay(new Date(e.start), now)).map((e) => `${fmtTime(e.start)}–${fmtTime(e.end)} ${e.title} (event)`),
    ...tasks.filter((t) => !t.done && t.scheduledStart && isSameDay(new Date(t.scheduledStart), now)).map((t) => `${fmtTime(t.scheduledStart!)}–${fmtTime(t.scheduledEnd!)} ${t.title} (task)`),
  ].sort();
  const open = tasks
    .filter((t) => !t.done)
    .slice(0, 40)
    .map((t) => `- ${t.title}${pname(t.projectId) ? ` [${pname(t.projectId)}]` : ""}${t.due ? ` due ${dueLabel(t.due)}` : ""}`);
  const deadlines = projects.filter((p) => p.deadline).map((p) => `- ${p.name}: ${dueLabel(p.deadline!)}`);
  return [
    `Now: ${fmtDate(now.toISOString(), { weekday: "long", day: "numeric", month: "long" })}, ${fmtTime(now.toISOString())}`,
    `Today's schedule:\n${today.join("\n") || "(nothing scheduled)"}`,
    `Open tasks:\n${open.join("\n") || "(none)"}`,
    `Project deadlines:\n${deadlines.join("\n") || "(none)"}`,
  ].join("\n\n");
}

export const ASSISTANT_SYSTEM = `You are the assistant inside mova, a calm productivity workspace. Help the user decide what to work on, plan their time, and get unstuck.
Rules:
- Be brief: a few short sentences or a short list. No preamble.
- Suggest; never claim you changed anything. The user does the work and edits their own tasks.
- Do not write essays, assignments or large pieces of work for the user. Offer an outline, a first step or a question instead.
- Use the workspace context below. If something isn't in it, say so.`;
