import { useEffect, useState } from "react";
import { RotateCcw, Timer, ChevronRight, Plus, Trash2 } from "lucide-react";
import ChecklistItemRow from "./ChecklistItemRow";
import SortableItems from "./SortableItems";
import { phaseTimeStats } from "./PhaseTimesCard";
import { fmtDur } from "@/lib/store";

const PhaseTimer = ({ start, onRestart }) => {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const sec = Math.max(0, Math.floor((now - (start || now)) / 1000));
  const fmt = `${String(Math.floor(sec / 3600)).padStart(2, "0")}:${String(Math.floor((sec % 3600) / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  return (
    <button onClick={onRestart} title="Faz zamanlayıcısını yeniden başlat" className="kb-btn !gap-2 !px-3" data-testid="checklist-timer-toggle">
      <Timer size={16} className="text-amber-400" />
      <span className="font-mono text-base text-amber-300" data-testid="checklist-phase-timer">{fmt}</span>
    </button>
  );
};

export default function PhasePanel({ state, list, phase, editing, actions }) {
  const all = list.phases.flatMap((p) => p.items);
  const done = all.filter((i) => state.checked[i.id]).length;
  const pct = all.length ? Math.round((done / all.length) * 100) : 0;
  const phaseIdx = list.phases.findIndex((p) => p.id === phase?.id);
  const next = list.phases[phaseIdx + 1];
  const phaseDone = phase && phase.items.length > 0 && phase.items.every((i) => state.checked[i.id]);
  const phaseBest = phase && phaseTimeStats(state.phaseHistory?.[list.id]?.[phase.id]);

  return (
    <section className="kb-card flex min-h-[60vh] flex-col">
      <div className="border-b border-[#1E293B] p-4 sm:p-6">
        {editing ? (
          <div className="mb-4 grid gap-2 sm:grid-cols-2">
            <input className="kb-input" value={list.name} onChange={(e) => actions.renameList(e.target.value, list.subtitle)} placeholder="Liste adı" data-testid="checklist-name-input" />
            <input className="kb-input" value={list.subtitle || ""} onChange={(e) => actions.renameList(list.name, e.target.value)} placeholder="Alt başlık" data-testid="checklist-subtitle-input" />
          </div>
        ) : (
          <p className="kb-label mb-1 truncate">{list.name}</p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {editing && phase ? (
            <div className="flex flex-1 gap-2">
              <input className="kb-input text-lg font-semibold" value={phase.name} onChange={(e) => actions.renamePhase(phase.id, e.target.value)} data-testid="checklist-phase-name-input" />
              <button className="kb-btn kb-btn-danger" onClick={() => actions.deletePhase(phase.id)} title="Fazı sil" data-testid="checklist-delete-phase-button"><Trash2 size={16} /></button>
            </div>
          ) : (
            <h2 className="text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl" data-testid="checklist-active-phase-title">{phase?.name || "Faz seçilmedi"}</h2>
          )}
          <div className="flex items-center gap-2">
            {phaseBest && (
              <span className="hidden font-mono text-[11px] text-slate-500 md:block" data-testid="phase-best-time">EN İYİ <span className="text-emerald-400">{fmtDur(phaseBest.best)}</span> · ORT {fmtDur(phaseBest.avg)}</span>
            )}
            <PhaseTimer start={state.phaseStart} onRestart={actions.restartTimer} />
            <button className="kb-btn kb-btn-danger" onClick={actions.reset} data-testid="checklist-reset-button"><RotateCcw size={16} />Listeyi Sıfırla</button>
          </div>
        </div>
        <div className="mt-5">
          <div className="mb-1.5 flex justify-between font-mono text-xs">
            <span className="text-slate-400">TAMAMLANMA</span>
            <span className={pct === 100 ? "text-emerald-400" : "text-sky-400"} data-testid="checklist-progress-text">{done}/{all.length} · %{pct}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-sm bg-[#0B0F19] ring-1 ring-[#1E293B]" data-testid="checklist-progress-bar">
            <div className={`h-full transition-[width] duration-500 ${pct === 100 ? "bg-emerald-500 shadow-[0_0_10px_#10B981]" : "bg-sky-400 shadow-[0_0_10px_#38BDF8]"}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="flex-1 space-y-2 p-3 sm:p-5">
        {editing && phase ? (
          <SortableItems phase={phase} actions={actions} />
        ) : (
          phase?.items.map((item) => <ChecklistItemRow key={item.id} item={item} checked={!!state.checked[item.id]} onToggle={() => actions.toggle(item.id)} />)
        )}
        {phase && phase.items.length === 0 && !editing && <p className="py-10 text-center text-slate-500">Bu fazda adım yok. "Düzenle" ile adım ekleyin.</p>}
        {editing && phase && (
          <button className="kb-btn kb-btn-primary w-full" onClick={() => actions.addItem(phase.id)} data-testid="checklist-add-item-button"><Plus size={16} />Adım Ekle</button>
        )}
      </div>

      {!editing && phaseDone && (
        <div className="flex items-center justify-between gap-3 border-t border-emerald-500/30 bg-emerald-500/5 p-4" data-testid="checklist-phase-complete">
          <span className="font-mono text-sm font-bold tracking-wider text-emerald-400">FAZ TAMAMLANDI</span>
          {next && <button className="kb-btn kb-btn-primary" onClick={() => actions.selectPhase(next)} data-testid="checklist-next-phase-button">Sonraki Faz: {next.name}<ChevronRight size={16} /></button>}
        </div>
      )}
    </section>
  );
}
