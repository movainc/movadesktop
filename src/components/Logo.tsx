type Props = { size?: number; mono?: boolean };

export function LogoMark({ size = 28, mono = false }: Props) {
  const ring = mono ? "currentColor" : "var(--logo-ring)";
  const ink = mono ? "currentColor" : "var(--logo-ink)";
  const accent = mono ? "currentColor" : "var(--accent)";
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-label="mova" role="img">
      <g fill="none" strokeWidth="5.5">
        <path d="M70.6 25.5 A32 32 0 0 0 18.5 55.6" stroke={ring} />
        <path d="M29.4 74.5 A32 32 0 0 0 66 77.7" stroke={ring} />
        <path d="M74.5 70.6 A32 32 0 0 0 80.9 41.7" stroke={accent} />
        <path d="M36 64 V42 M36 52 Q37.5 43 44 43 Q49 43 50 51" stroke={ink} strokeWidth="7" />
        <path d="M51 64 Q50 40 72 31.5" stroke={ink} strokeWidth="7" />
        <path d="M63 64 V51 Q63 47 66 44" stroke={accent} strokeWidth="7" />
      </g>
      <circle cx="21" cy="64" r="6" fill={ink} />
      <circle cx="76.5" cy="30" r="4.8" fill={accent} />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <LogoMark size={26} />
      <span>mova</span>
    </span>
  );
}
