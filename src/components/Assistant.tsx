import { useEffect, useRef, useState } from "react";
import { ArrowUp, Loader2, Sparkles, X } from "lucide-react";
import { useStore } from "../lib/store";
import { ASSISTANT_SYSTEM, aiComplete, isDesktop, workspaceContext, type ChatMessage } from "../lib/ai";

const STARTERS = ["What should I work on next?", "Plan the rest of my day", "What's due this week?"];

export function Assistant() {
  const close = useStore((s) => s.setAssistantOpen);
  const go = useStore((s) => s.go);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, busy]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  const send = async (text: string) => {
    const q = text.trim();
    if (!q || busy) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: q }];
    setMessages(next);
    setInput("");
    setBusy(true);
    setError("");
    try {
      const reply = await aiComplete([{ role: "system", content: `${ASSISTANT_SYSTEM}\n\n${workspaceContext()}` }, ...next.slice(-10)], 350);
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="assistant" aria-label="Assistant">
      <header className="assistant-head">
        <span className="assistant-title"><Sparkles size={15} /> Assistant</span>
        <button className="icon-btn" onClick={() => close(false)} aria-label="Close assistant"><X size={16} /></button>
      </header>

      <div className="assistant-body">
        {messages.length === 0 && (
          <div className="assistant-intro">
            <p className="assistant-lead">Ask about your day, deadlines or where to start.</p>
            <p className="quiet">The assistant suggests; you stay in charge of the work.</p>
            {isDesktop ? (
              <div className="assistant-starters">
                {STARTERS.map((s) => <button key={s} className="chip" onClick={() => send(s)}>{s}</button>)}
              </div>
            ) : (
              <p className="ai-error">AI features run in the mova desktop app.</p>
            )}
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`bubble bubble-${m.role}`}>{m.content}</div>
        ))}
        {busy && <div className="bubble bubble-assistant bubble-busy"><Loader2 size={14} className="spin" /> Thinking…</div>}
        {error && (
          <div className="ai-error">
            {error}
            {/API key/i.test(error) && <button className="link-btn" onClick={() => { close(false); go({ name: "settings" }); }}>Open settings</button>}
          </div>
        )}
        <div ref={endRef} />
      </div>

      <form className="assistant-input" onSubmit={(e) => { e.preventDefault(); send(input); }}>
        <textarea
          value={input}
          rows={1}
          placeholder="Ask mova…"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
          autoFocus
        />
        <button className="icon-btn send-btn" type="submit" disabled={!input.trim() || busy} aria-label="Send"><ArrowUp size={15} /></button>
      </form>
    </aside>
  );
}
