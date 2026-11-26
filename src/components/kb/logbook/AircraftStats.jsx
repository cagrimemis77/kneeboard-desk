import { Plane } from "lucide-react";
import { landingRating } from "@/lib/store";

export default function AircraftStats({ logs, settings }) {
  if (!logs.length) return null;
  const groups = {};
  logs.forEach((l) => {
    const key = (l.type || "—").trim().toUpperCase();
    const g = (groups[key] = groups[key] || { label: (l.type || "—").trim(), n: 0, min: 0, fpm: [] });
    g.n += 1;
    g.min += Number(l.duration) || 0;
    g.fpm.push(Number(l.fpm));
  });
  const rows = Object.values(groups)
    .map((g) => ({ ...g, avg: Math.round(g.fpm.reduce((a, b) => a + b, 0) / g.n), best: Math.max(...g.fpm) }))
    .sort((a, b) => b.n - a.n);
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.avg)), 1);

  return (
    <section className="kb-card p-4" data-testid="aircraft-stats">
      <span className="flex items-center gap-1.5 kb-label"><Plane size={13} />Uçak / Araç Bazlı İstatistik</span>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="text-left">
              {["Tip", "Uçuş", "Süre", "Ort. İniş", "En Yumuşak"].map((h) => <th key={h} className="kb-label px-2 py-2 font-normal">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const rating = landingRating(r.avg, settings);
              return (
                <tr key={r.label} className="border-t border-[#1E293B]/60" data-testid={`aircraft-stat-${r.label}`}>
                  <td className="px-2 py-2.5 font-semibold text-slate-100">{r.label}</td>
                  <td className="px-2 py-2.5 font-mono text-slate-300">{r.n}</td>
                  <td className="px-2 py-2.5 font-mono text-slate-300">{(r.min / 60).toFixed(1)} sa</td>
                  <td className="px-2 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="w-12 font-mono text-slate-100">{r.avg}</span>
                      <div className="h-1.5 w-24 overflow-hidden rounded-sm bg-[#0B0F19]">
                        <div className={`h-full ${rating.key === "soft" ? "bg-emerald-500" : rating.key === "normal" ? "bg-sky-400" : "bg-amber-500"}`} style={{ width: `${(Math.abs(r.avg) / maxAbs) * 100}%` }} />
                      </div>
                      <span className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${rating.cls}`}>{rating.label}</span>
                    </div>
                  </td>
                  <td className="px-2 py-2.5 font-mono text-emerald-400">{r.best}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
