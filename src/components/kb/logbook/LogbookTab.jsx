import { useState } from "react";
import { toast } from "sonner";
import { uid, matchProfile } from "@/lib/store";
import LogForm from "./LogForm";
import AircraftStats from "./AircraftStats";
import KpiCards from "./KpiCards";
import LogTable from "./LogTable";
import LandingChart from "./LandingChart";

export default function LogbookTab({ state, setState }) {
  const [editing, setEditing] = useState(null);
  const autoProfile = (type) => {
    const p = matchProfile(type, state.settings.aircraftProfiles);
    if (!p || p.id === state.settings.activeProfileId) return;
    setState((s) => ({ ...s, settings: { ...s.settings, activeProfileId: p.id } }));
    toast.info(`Limit profili otomatik seçildi: ${p.name}`, { id: "auto-profile" });
  };
  const save = (entry) => {
    if (editing) {
      setState((s) => ({ ...s, logs: s.logs.map((l) => (l.id === editing.id ? { ...entry, id: l.id } : l)) }));
      setEditing(null);
      toast.success("Kayıt güncellendi");
    } else {
      setState((s) => ({ ...s, logs: [{ ...entry, id: uid() }, ...s.logs] }));
      toast.success("Kayıt deftere eklendi");
    }
  };
  const remove = (id) => {
    if (!window.confirm("Bu kayıt silinsin mi?")) return;
    setState((s) => ({ ...s, logs: s.logs.filter((l) => l.id !== id) }));
    if (editing?.id === id) setEditing(null);
    toast.success("Kayıt silindi");
  };
  return (
    <div className="grid gap-5 lg:grid-cols-[380px_minmax(0,1fr)] kb-rise" data-testid="logbook-tab">
      <LogForm key={editing?.id || "new"} initial={editing} onSave={save} onCancel={() => setEditing(null)} onTypeChange={autoProfile} profiles={state.settings.aircraftProfiles || []} />
      <div className="min-w-0 space-y-5">
        <KpiCards logs={state.logs} settings={state.settings} />
        <LandingChart logs={state.logs} settings={state.settings} />
        <AircraftStats logs={state.logs} settings={state.settings} />
        <LogTable logs={state.logs} settings={state.settings} onDelete={remove} onEdit={setEditing} editingId={editing?.id} />
      </div>
    </div>
  );
}
