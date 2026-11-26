import { Timer, Trash2 } from "lucide-react";
import { fmtDur } from "@/lib/store";

export const phaseTimeStats = (runs = []) => {
  if (!runs.length) return null;
  const secs = runs.map((r) => r.sec);
  return { n: secs.length, best: Math.min(...secs), avg: Math.round(secs.reduce((a, b) => a + b, 0) / secs.length), last: secs[secs.length - 1] };
};

export default function PhaseTimesCard({ list, history, activePhaseId, onClear }) {
  const h = history || {};
  const any = list.phases.some((p) => h[p.id]?.length);
  return (
    <section className="kb-card p-4" data-testid="phase-times-card">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-1.5 kb-label"><Timer size={13} />Faz Süreleri</span>
        {any && <button className="kb-btn kb-btn-danger !min-h-[36px] !px-2" onClick={onClear} title="Süreleri temizle" data-testid="phase-times-clear"><Trash2 size={14} /></button>}
      </div>
      {any ? (
        <table className="w-full font-mono text-xs">
          <thead>
            <tr className="text-left text-[10px] text-slate-500">
              <th className="py-1 font-normal">FAZ</th><th className="font-normal">EN İYİ</th><th className="font-normal">ORT.</th><th className="text-right font-normal">KEZ</th>
            </tr>
          </thead>
          <tbody>
            {list.phases.map((p) => {
              const st = phaseTimeStats(h[p.id]);
              return (
                <tr key={p.id} className={`border-t border-[#1E293B]/60 ${p.id === activePhaseId ? "text-sky-300" : "text-slate-300"}`} data-testid={`phase-time-row-${p.id}`}>
                  <td className="max-w-[140px] truncate py-1.5 pr-2 font-sans text-[13px]" title={p.name}>{p.name}</td>
                  <td className="text-emerald-400">{st ? fmtDur(st.best) : "—"}</td>
                  <td>{st ? fmtDur(st.avg) : "—"}</td>
                  <td className="text-right text-slate-500">{st?.n || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      ) : (
        <p className="text-sm text-slate-500">Bir fazın tüm adımlarını tamamladığınızda süresi burada kaydedilir.</p>
      )}
    </section>
  );
}
