import { Droplets } from "lucide-react";
import { SURFACES } from "@/lib/templates";

export default function SurfacePicker({ value, onSelect, settings }) {
  const cur = SURFACES.find((s) => s.id === value) || SURFACES[0];
  return (
    <div className="mt-3" data-testid="surface-picker">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 kb-label"><Droplets size={13} />Pist Yüzeyi (RWYCC)</span>
        <span className="font-mono text-[11px] text-slate-400" data-testid="surface-status">
          RWYCC {cur.rwycc} · {cur.desc}
          {settings.surfaceCapped && <span className="text-amber-400"> · XW ≤ {settings.surfaceCap} kt</span>}
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {SURFACES.map((s) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            data-testid={`surface-${s.id}`}
            className={`kb-btn !min-h-[40px] shrink-0 !px-3 text-xs ${s.id === cur.id ? (s.rwycc <= 4 ? "!border-amber-500/60 !bg-amber-500/10 !text-amber-400" : "kb-btn-primary") : ""}`}
          >
            <span className="font-mono text-[10px] opacity-60">{s.rwycc}</span>{s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
