import { Check, AlertTriangle } from "lucide-react";

export const CriticalBadge = () => (
  <span className="inline-flex items-center gap-1 rounded-sm border border-amber-500/50 bg-amber-500/10 px-1.5 py-0.5 font-mono text-[10px] font-bold tracking-wider text-amber-400" data-testid="critical-badge">
    <AlertTriangle size={11} />KRİTİK
  </span>
);

export default function ChecklistItemRow({ item, checked, onToggle }) {
  return (
    <button
      onClick={onToggle}
      data-testid={`checklist-item-checkbox-${item.id}`}
      aria-pressed={checked}
      className={`group flex min-h-[60px] w-full items-center gap-4 rounded-md border px-3 py-2.5 text-left transition-colors ${checked ? "border-emerald-500/30 bg-emerald-500/5" : item.critical ? "border-amber-500/25 hover:border-amber-500/50 hover:bg-[#162032]" : "border-[#1E293B] hover:border-[#334155] hover:bg-[#162032]"}`}
    >
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-150 ${checked ? "scale-95 border-emerald-500 bg-emerald-500 text-[#0B0F19]" : "border-slate-600 bg-[#0B0F19] group-hover:border-sky-400"}`}>
        {checked && <Check size={26} strokeWidth={3} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className={`font-semibold sm:text-[17px] ${checked ? "text-slate-500 line-through decoration-emerald-500/60" : "text-slate-100"}`}>{item.text}</span>
          {item.critical && <CriticalBadge />}
        </span>
        {item.note && <span className="mt-0.5 block text-xs text-amber-300/80">{item.note}</span>}
      </span>
      {item.action && (
        <span className={`hidden shrink-0 text-right font-mono text-sm font-semibold sm:block ${checked ? "text-emerald-400" : "text-sky-400"}`}>{item.action}</span>
      )}
    </button>
  );
}
