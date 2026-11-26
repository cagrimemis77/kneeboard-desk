const C = 160;
const R = 140;
const LABELS = { 0: "N", 90: "E", 180: "S", 270: "W" };

export default function WindCompass({ heading, wind, runwayLabel, reciprocal, simulated, onPickDir }) {
  const hasRwy = heading !== undefined && heading !== null && !isNaN(heading);
  const hasDir = wind && !wind.variable && wind.dir !== null;
  const pick = (e) => {
    if (!onPickDir) return;
    const b = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (b.left + b.width / 2);
    const dy = e.clientY - (b.top + b.height / 2);
    if (Math.hypot(dx, dy) < b.width * 0.08) return;
    const deg = ((Math.atan2(dx, -dy) * 180) / Math.PI + 360) % 360;
    onPickDir(Math.round(deg / 5) * 5 % 360);
  };
  const down = (e) => { if (!onPickDir) return; e.currentTarget.setPointerCapture(e.pointerId); pick(e); };
  const move = (e) => { if (onPickDir && e.currentTarget.hasPointerCapture(e.pointerId)) pick(e); };
  const arrow = simulated ? "#F59E0B" : "#38BDF8";
  return (
    <svg viewBox="0 0 320 320" className={`w-full max-w-[380px] select-none ${onPickDir ? "cursor-crosshair touch-none" : ""}`} onPointerDown={down} onPointerMove={move} data-testid="svg-compass-runway">
      <defs>
        <marker id="kb-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill={arrow} />
        </marker>
      </defs>
      <circle cx={C} cy={C} r={R + 10} fill="#0B0F19" stroke={simulated ? "#F59E0B" : "#1E293B"} strokeDasharray={simulated ? "6 4" : undefined} />
      <circle cx={C} cy={C} r={R - 30} fill="none" stroke="#1E293B" strokeDasharray="2 4" />
      {Array.from({ length: 72 }, (_, i) => i * 5).map((d) => (
        <line key={d} x1={C} y1={C - R} x2={C} y2={C - R + (d % 30 === 0 ? 14 : d % 10 === 0 ? 8 : 4)} stroke={d % 30 === 0 ? "#64748B" : "#334155"} strokeWidth={d % 30 === 0 ? 2 : 1} transform={`rotate(${d} ${C} ${C})`} />
      ))}
      {Array.from({ length: 12 }, (_, i) => i * 30).map((d) => {
        const a = ((d - 90) * Math.PI) / 180;
        return (
          <text key={d} x={C + (R - 26) * Math.cos(a)} y={C + (R - 26) * Math.sin(a) + 4} textAnchor="middle" fontSize={LABELS[d] ? 14 : 10} fontFamily="JetBrains Mono" fill={LABELS[d] ? "#E2E8F0" : "#64748B"} fontWeight={LABELS[d] ? 700 : 400}>
            {LABELS[d] || String(d / 10).padStart(2, "0")}
          </text>
        );
      })}
      {hasRwy && (
        <g transform={`rotate(${heading} ${C} ${C})`} style={{ transition: "transform 0.5s" }}>
          <rect x={C - 13} y={C - 82} width={26} height={164} rx={2} fill="#1E293B" stroke="#475569" />
          {[-60, -36, -12, 12, 36].map((y) => <line key={y} x1={C} y1={C + y} x2={C} y2={C + y + 14} stroke="#E2E8F0" strokeWidth={1.5} />)}
          <text x={C} y={C + 76} textAnchor="middle" fontSize={11} fontFamily="JetBrains Mono" fill="#F8FAFC" fontWeight={700}>{runwayLabel}</text>
          <text x={C} y={C - 66} textAnchor="middle" fontSize={9} fontFamily="JetBrains Mono" fill="#64748B" transform={`rotate(180 ${C} ${C - 69})`}>{reciprocal}</text>
          <path d={`M${C} ${C + 98} l-6 10 h12 z`} fill="#10B981" />
        </g>
      )}
      {hasDir && (
        <g transform={`rotate(${wind.dir} ${C} ${C})`} style={{ transition: onPickDir ? "none" : "transform 0.5s" }}>
          <line x1={C} y1={C - R - 4} x2={C} y2={C - 42} stroke={arrow} strokeWidth={3} markerEnd="url(#kb-arrow)" />
          <circle cx={C} cy={C - R - 4} r={onPickDir ? 8 : 4} fill={arrow} />
        </g>
      )}
      <circle cx={C} cy={C} r={3} fill="#F59E0B" />
      {wind && (
        <text x={C} y={312} textAnchor="middle" fontSize={11} fontFamily="JetBrains Mono" fill={arrow} data-testid="compass-wind-label">
          {wind.variable ? "VRB" : `${String(wind.dir).padStart(3, "0")}°`}/{wind.speed}{wind.gust ? `G${wind.gust}` : ""}KT
        </text>
      )}
    </svg>
  );
}
