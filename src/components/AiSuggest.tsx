import { useState } from "react";
import { Loader2, Sparkles, X } from "lucide-react";
import { Checkbox } from "./ui";

type Props = {
  label: string;
  load: () => Promise<string[]>;
  onAdd: (items: string[]) => void;
  compact?: boolean;
};

export function AiSuggest({ label, load, onAdd, compact }: Props) {
  const [state, setState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [items, setItems] = useState<string[]>([]);
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [error, setError] = useState("");

  const run = async () => {
    setState("loading");
    setError("");
    try {
      const out = await load();
      setItems(out);
      setPicked(new Set(out.map((_, i) => i)));
      setState(out.length ? "ready" : "error");
      if (!out.length) setError("No suggestions this time.");
    } catch (e) {
      setError(String(e instanceof Error ? e.message : e));
      setState("error");
    }
  };

  const reset = () => { setState("idle"); setItems([]); };

  if (state === "idle" || state === "loading") {
    return (
      <button className={`btn ${compact ? "btn-sm" : ""} btn-ai`} onClick={run} disabled={state === "loading"}>
        {state === "loading" ? <Loader2 size={13} className="spin" /> : <Sparkles size={13} />}
        {label}
      </button>
    );
  }

  return (
    <div className="ai-card">
      <header className="ai-card-head">
        <span><Sparkles size={13} /> Suggestions</span>
        <button className="icon-btn icon-btn-xs" onClick={reset} aria-label="Dismiss"><X size={13} /></button>
      </header>
      {state === "error" ? (
        <p className="ai-error">{error}</p>
      ) : (
        <>
          <ul className="ai-list">
            {items.map((it, i) => (
              <li key={i}>
                <Checkbox
                  checked={picked.has(i)}
                  label={it}
                  onChange={() => {
                    const n = new Set(picked);
                    if (n.has(i)) n.delete(i); else n.add(i);
                    setPicked(n);
                  }}
                />
                <span>{it}</span>
              </li>
            ))}
          </ul>
          <footer className="ai-card-foot">
            <span className="quiet">Review before adding.</span>
            <button className="btn btn-sm btn-primary" disabled={!picked.size} onClick={() => { onAdd(items.filter((_, i) => picked.has(i))); reset(); }}>
              Add {picked.size} {picked.size === 1 ? "task" : "tasks"}
            </button>
          </footer>
        </>
      )}
    </div>
  );
}
