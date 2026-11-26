import { Plus, Pencil, Check, Trash2, CircleCheck } from "lucide-react";
import SortablePhases from "./SortablePhases";
import PhaseTimesCard from "./PhaseTimesCard";

const phaseStats = (phase, checked) => {
  const done = phase.items.filter((i) => checked[i.id]).length;
  return { done, total: phase.items.length, complete: phase.items.length > 0 && done === phase.items.length };
};

export default function ChecklistSidebar({ state, list, phase, editing, setEditing, actions }) {
  const renderPhase = (p, idx) => {
    const st = phaseStats(p, state.checked);
    const active = p.id === phase?.id;
    return (
      <button
        onClick={() => actions.selectPhase(p)}
        data-testid={`checklist-phase-${p.id}`}
        className={`flex min-h-[48px] w-full items-center gap-3 rounded-md border px-3 text-left transition-colors ${active ? "border-sky-500/60 bg-[#162032]" : "border-transparent hover:bg-[#162032]"}`}
      >
        <span className={`font-mono text-xs ${active ? "text-sky-400" : "text-slate-500"}`}>{String(idx + 1).padStart(2, "0")}</span>
        <span className={`flex-1 text-sm font-medium ${st.complete ? "text-emerald-400" : active ? "text-slate-100" : "text-slate-300"}`}>{p.name}</span>
        {st.complete ? <CircleCheck size={18} className="text-emerald-400" /> : <span className="font-mono text-xs text-slate-500">{st.done}/{st.total}</span>}
      </button>
    );
  };
  return (
    <aside className="space-y-4">
      <section className="kb-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="kb-label">Kontrol Listeleri</span>
          <button className="kb-btn !min-h-[40px] !px-3 text-xs" onClick={actions.addList} data-testid="checklist-add-list-button"><Plus size={16} />Yeni Liste</button>
        </div>
        <div className="space-y-2" data-testid="checklist-template-select">
          {state.checklists.map((c) => (
            <button
              key={c.id}
              onClick={() => actions.selectList(c)}
              data-testid={`checklist-select-${c.id}`}
              className={`w-full rounded-md border p-3 text-left transition-colors min-h-[44px] ${c.id === list.id ? "border-sky-500/60 bg-sky-500/10" : "border-[#1E293B] hover:border-[#334155] hover:bg-[#162032]"}`}
            >
              <div className={`text-sm font-semibold leading-snug ${c.id === list.id ? "text-sky-300" : "text-slate-200"}`}>{c.name}</div>
              <div className="mt-0.5 font-mono text-[11px] text-slate-500">{c.subtitle} · {c.phases.length} FAZ</div>
            </button>
          ))}
        </div>
      </section>

      <section className="kb-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="kb-label">Fazlar</span>
          <div className="flex gap-2">
            {editing && <button className="kb-btn !min-h-[40px] !px-3" onClick={actions.addPhase} title="Faz ekle" data-testid="checklist-add-phase-button"><Plus size={16} /></button>}
            <button className={`kb-btn !min-h-[40px] !px-3 text-xs ${editing ? "kb-btn-primary" : ""}`} onClick={() => setEditing(!editing)} data-testid="checklist-edit-toggle">
              {editing ? <><Check size={16} />Bitti</> : <><Pencil size={16} />Düzenle</>}
            </button>
          </div>
        </div>
        {editing ? (
          <SortablePhases phases={list.phases} onMove={actions.movePhase} renderRow={renderPhase} />
        ) : (
          <ol className="space-y-1.5">
            {list.phases.map((p, idx) => <li key={p.id}>{renderPhase(p, idx)}</li>)}
          </ol>
        )}
        {list.phases.length === 0 && <p className="py-4 text-center text-sm text-slate-500">Faz yok — düzenleme modunda ekleyin.</p>}
        {editing && list.phases.length > 1 && <p className="mt-2 font-mono text-[11px] text-slate-500">Fazları tutamaçtan sürükleyerek sıralayın.</p>}
        {editing && (
          <button className="kb-btn kb-btn-danger mt-4 w-full" onClick={actions.deleteList} data-testid="checklist-delete-list-button"><Trash2 size={16} />Bu Listeyi Sil</button>
        )}
      </section>
      <PhaseTimesCard list={list} history={state.phaseHistory?.[list.id]} activePhaseId={phase?.id} onClear={actions.clearHistory} />
    </aside>
  );
}
