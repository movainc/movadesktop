import { useEffect, useRef, useState } from "react";
import {
  BookOpen, Bot, Briefcase, Calculator, Camera, Code2, Dumbbell, FlaskConical, Gamepad2, Globe, GraduationCap, Heart,
  Home, Landmark, Lightbulb, Music, Palette, PenTool, Plane, Rocket, ShoppingBag, Sprout, Trophy, Video, type LucideIcon,
} from "lucide-react";
import type { Project } from "../lib/types";

export const PROJECT_ICONS: Record<string, LucideIcon> = {
  book: BookOpen, school: GraduationCap, history: Landmark, science: FlaskConical, maths: Calculator, write: PenTool,
  code: Code2, robot: Bot, rocket: Rocket, idea: Lightbulb, work: Briefcase, globe: Globe,
  design: Palette, video: Video, camera: Camera, music: Music, game: Gamepad2, sport: Trophy,
  fitness: Dumbbell, health: Heart, home: Home, travel: Plane, shopping: ShoppingBag, grow: Sprout,
};

export function ProjectBadge({ project, size = 30 }: { project: Pick<Project, "name" | "color" | "icon">; size?: number }) {
  const Icon = project.icon ? PROJECT_ICONS[project.icon] : undefined;
  return (
    <span className="project-badge" style={{ background: project.color, width: size, height: size, borderRadius: Math.round(size * 0.26), fontSize: size * 0.45 }}>
      {Icon ? <Icon size={Math.round(size * 0.55)} strokeWidth={2} /> : project.name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

export function ProjectGlyph({ project, size = 14 }: { project: Pick<Project, "color" | "icon">; size?: number }) {
  const Icon = project.icon ? PROJECT_ICONS[project.icon] : undefined;
  if (!Icon) return <span className="dot" style={{ background: project.color, width: 8, height: 8 }} />;
  return <Icon size={size} color={project.color} strokeWidth={2} />;
}

export function IconGrid({ value, color, onChange }: { value?: string; color: string; onChange: (icon?: string) => void }) {
  return (
    <div className="icon-grid">
      <button type="button" className={`icon-cell ${!value ? "is-active" : ""}`} onClick={() => onChange(undefined)} title="Letter" style={!value ? { color } : undefined}>
        Aa
      </button>
      {Object.entries(PROJECT_ICONS).map(([key, Icon]) => (
        <button type="button" key={key} className={`icon-cell ${value === key ? "is-active" : ""}`} onClick={() => onChange(key)} title={key} aria-label={`Icon ${key}`} style={value === key ? { color } : undefined}>
          <Icon size={16} />
        </button>
      ))}
    </div>
  );
}

export function IconPickerButton({ project, onChange, size = 44 }: { project: Project; onChange: (icon?: string) => void; size?: number }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);
  return (
    <div className="icon-picker" ref={ref}>
      <button className="icon-picker-trigger" onClick={() => setOpen(!open)} aria-label="Change project icon" title="Change icon">
        <ProjectBadge project={project} size={size} />
      </button>
      {open && (
        <div className="icon-popover">
          <IconGrid value={project.icon} color={project.color} onChange={(i) => { onChange(i); setOpen(false); }} />
        </div>
      )}
    </div>
  );
}
