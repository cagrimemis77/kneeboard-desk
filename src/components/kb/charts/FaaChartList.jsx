import { useState } from "react";
import { ExternalLink, Eye, Star, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { FAA_GROUPS } from "@/lib/charts";

export default function FaaChartList({ icao, faa, onView, onBookmark }) {
  const [q, setQ] = useState("");
  const term = q.trim().toUpperCase();
  return (
    <div className="space-y-2" data-testid="faa-chart-list">
      <input className="kb-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Chart filtrele (ör. ILS 04L)" data-testid="faa-chart-filter" />
      {FAA_GROUPS.map((g) => {
        const items = faa.groups[g.key].filter((c) => !term || c.name.toUpperCase().includes(term));
        if (!items.length) return null;
        return (
          <details key={g.key} open={g.key === "apd" || !!term} className="group rounded-md border border-[#1E293B] bg-[#0B0F19]" data-testid={`faa-group-${g.key}`}>
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between px-3 text-sm font-semibold text-slate-200">
              <span>{g.label} <span className="font-mono text-xs text-slate-500">({items.length})</span></span>
              <ChevronDown size={16} className="transition-transform group-open:rotate-180" />
            </summary>
            <ul className="border-t border-[#1E293B]">
              {items.map((c) => (
                <li key={c.url} className="flex items-center gap-1 border-b border-[#1E293B]/50 px-2 py-1 last:border-0">
                  <span className="min-w-0 flex-1 truncate pl-1 font-mono text-xs text-slate-300" title={c.name}>{c.name}</span>
                  <button className="kb-btn !min-h-[40px] !px-2" onClick={() => onView({ name: `${icao} ${c.name}`, url: c.url })} title="Uygulamada aç" data-testid={`faa-view-${c.url.split("/").pop()}`}><Eye size={16} /></button>
                  <a className="kb-btn !min-h-[40px] !px-2" href={c.url} target="_blank" rel="noopener noreferrer" title="Yeni sekmede aç"><ExternalLink size={16} /></a>
                  <button className="kb-btn !min-h-[40px] !px-2 hover:!text-amber-400" onClick={() => { onBookmark({ label: `${icao} ${c.name}`, url: c.url, icao }); toast.success("Favorilere eklendi"); }} title="Favorilere ekle" data-testid={`faa-bookmark-${c.url.split("/").pop()}`}><Star size={16} /></button>
                </li>
              ))}
            </ul>
          </details>
        );
      })}
    </div>
  );
}
