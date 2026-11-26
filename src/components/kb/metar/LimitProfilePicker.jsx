import { Plane } from "lucide-react";

export default function LimitProfilePicker({ profiles, activeId, onSelect, settings }) {
  const chip = (id, label) => (
    <button
      key={id || "manual"}
      onClick={() => onSelect(id)}
      data-testid={`limit-profile-${id || "manual"}`}
      className={`kb-btn !min-h-[40px] shrink-0 !px-3 font-mono text-xs ${activeId === id || (!id && !profiles.some((p) => p.id === activeId)) ? "kb-btn-primary" : ""}`}
    >
      {label}
    </button>
  );
  return (
    <div className="mt-3" data-testid="limit-profile-picker">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 kb-label"><Plane size={13} />Uçak Limit Profili</span>
        <span className="font-mono text-[11px] text-slate-400" data-testid="limit-profile-values">
          XW <span className="text-amber-400">{settings.cautionCrosswind}</span>/<span className="text-rose-400">{settings.maxCrosswind}</span> · TW <span className="text-rose-400">{settings.maxTailwind}</span> kt
        </span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {profiles.map((p) => chip(p.id, p.name))}
        {chip(null, "Manuel")}
      </div>
    </div>
  );
}
