import { useState } from "react";
import { toast } from "sonner";
import { arrayMove } from "@dnd-kit/sortable";
import { uid, fmtDur } from "@/lib/store";
import ChecklistSidebar from "./ChecklistSidebar";
import PhasePanel from "./PhasePanel";

export default function ChecklistTab({ state, setState }) {
  const [editing, setEditing] = useState(false);
  const list = state.checklists.find((c) => c.id === state.activeChecklistId) || state.checklists[0];
  const phase = list.phases.find((p) => p.id === state.activePhaseId) || list.phases[0];

  const patch = (p) => setState((s) => ({ ...s, ...p }));
  const updateList = (fn) => setState((s) => ({ ...s, checklists: s.checklists.map((c) => (c.id === list.id ? fn(c) : c)) }));
  const updatePhase = (pid, fn) => updateList((c) => ({ ...c, phases: c.phases.map((p) => (p.id === pid ? fn(p) : p)) }));

  const actions = {
    selectList: (c) => patch({ activeChecklistId: c.id, activePhaseId: c.phases[0]?.id, phaseStart: Date.now() }),
    selectPhase: (p) => patch({ activePhaseId: p.id, phaseStart: Date.now() }),
    restartTimer: () => patch({ phaseStart: Date.now() }),
    toggle: (id) => {
      const nowChecked = !state.checked[id];
      const completes = nowChecked && phase?.items.some((i) => i.id === id) && phase.items.every((i) => i.id === id || state.checked[i.id]);
      const sec = Math.max(1, Math.round((Date.now() - state.phaseStart) / 1000));
      setState((s) => {
        const checked = { ...s.checked, [id]: nowChecked };
        if (!completes) return { ...s, checked };
        const h = s.phaseHistory || {};
        const lh = h[list.id] || {};
        return { ...s, checked, phaseHistory: { ...h, [list.id]: { ...lh, [phase.id]: [...(lh[phase.id] || []), { sec, at: Date.now() }].slice(-20) } } };
      });
      if (completes) toast.success(`${phase.name} tamamlandı · ${fmtDur(sec)}`);
    },
    clearHistory: () => {
      if (!window.confirm("Bu listenin tüm faz süreleri silinsin mi?")) return;
      setState((s) => ({ ...s, phaseHistory: { ...s.phaseHistory, [list.id]: {} } }));
    },
    reset: () => {
      const ids = list.phases.flatMap((p) => p.items.map((i) => i.id));
      setState((s) => {
        const checked = { ...s.checked };
        ids.forEach((i) => delete checked[i]);
        return { ...s, checked, activePhaseId: list.phases[0]?.id, phaseStart: Date.now() };
      });
      toast.success("Liste sıfırlandı");
    },
    addList: () => {
      const c = { id: uid(), name: "Yeni Kontrol Listesi", subtitle: "Özel SOP", phases: [{ id: uid(), name: "Faz 1", items: [] }] };
      setState((s) => ({ ...s, checklists: [...s.checklists, c], activeChecklistId: c.id, activePhaseId: c.phases[0].id, phaseStart: Date.now() }));
      setEditing(true);
    },
    deleteList: () => {
      if (state.checklists.length <= 1) return toast.error("En az bir kontrol listesi kalmalı");
      if (!window.confirm(`"${list.name}" silinsin mi?`)) return;
      setState((s) => {
        const rest = s.checklists.filter((c) => c.id !== list.id);
        return { ...s, checklists: rest, activeChecklistId: rest[0].id, activePhaseId: rest[0].phases[0]?.id };
      });
      toast.success("Kontrol listesi silindi");
    },
    renameList: (name, subtitle) => updateList((c) => ({ ...c, name, subtitle })),
    addPhase: () => {
      const p = { id: uid(), name: `Faz ${list.phases.length + 1}`, items: [] };
      updateList((c) => ({ ...c, phases: [...c.phases, p] }));
      patch({ activePhaseId: p.id, phaseStart: Date.now() });
    },
    renamePhase: (pid, name) => updatePhase(pid, (p) => ({ ...p, name })),
    deletePhase: (pid) => {
      if (!window.confirm("Bu faz ve tüm adımları silinsin mi?")) return;
      const rest = list.phases.filter((p) => p.id !== pid);
      updateList((c) => ({ ...c, phases: rest }));
      patch({ activePhaseId: rest[0]?.id });
    },
    addItem: (pid) => updatePhase(pid, (p) => ({ ...p, items: [...p.items, { id: uid(), text: "Yeni adım", action: "KONTROL", critical: false, note: "" }] })),
    updateItem: (pid, iid, data) => updatePhase(pid, (p) => ({ ...p, items: p.items.map((i) => (i.id === iid ? { ...i, ...data } : i)) })),
    deleteItem: (pid, iid) => updatePhase(pid, (p) => ({ ...p, items: p.items.filter((i) => i.id !== iid) })),
    moveItem: (pid, from, to) => updatePhase(pid, (p) => ({ ...p, items: arrayMove(p.items, from, to) })),
    movePhase: (from, to) => updateList((c) => ({ ...c, phases: arrayMove(c.phases, from, to) })),
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[360px_1fr] kb-rise" data-testid="checklist-tab">
      <ChecklistSidebar state={state} list={list} phase={phase} editing={editing} setEditing={setEditing} actions={actions} />
      <PhasePanel state={state} list={list} phase={phase} editing={editing} actions={actions} />
    </div>
  );
}
