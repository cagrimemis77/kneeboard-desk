import { Plus, Trash2, Check } from "lucide-react";
import { uid } from "@/lib/store";

const NUM = [
  { k: "caution", label: "Uyarı" },
  { k: "max", label: "Maks XW" },
  { k: "wet", label: "Islak XW", optional: true },
  { k: "tail", label: "Maks TW" },
];

export default function ProfileEditor({ settings, setSettings }) {
  const list = settings.aircraftProfiles || [];
  const write = (fn) => setSettings((s) => ({ ...s, aircraftProfiles: fn(s.aircraftProfiles || []) }));
  const upd = (id, p) => write((l) => l.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const add = () => {
    const p = { id: uid(), name: "Yeni Uçak", caution: 20, max: 30, tail: 10 };
    write((l) => [...l, p]);
  };
  const del = (id) => {
    write((l) => l.filter((x) => x.id !== id));
    if (settings.activeProfileId === id) setSettings((s) => ({ ...s, activeProfileId: null }));
  };
  return (
    <div className="space-y-2 border-t border-[#1E293B] pt-4" data-testid="profile-editor">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-slate-200">Uçak Limit Profilleri (kt)</div>
          <p className="text-xs text-slate-500">Airbus FCOM gösterilmiş (demonstrated) değerleri, hamle dahil. "Islak XW" şirket ıslak pist limitidir (boş = 38 kt); kontamine pistlerde de üst sınır olarak uygulanır.</p>
        </div>
        <button className="kb-btn !min-h-[40px] shrink-0 !px-3 text-xs" onClick={add} data-testid="profile-add"><Plus size={14} />Ekle</button>
      </div>
      <div className="grid grid-cols-[1fr_repeat(4,60px)_auto_auto] items-center gap-1.5 font-mono text-[10px] text-slate-500">
        <span>TİP</span>{NUM.map((n) => <span key={n.k} className="text-center">{n.label}</span>)}<span /><span />
      </div>
      {list.map((p) => {
        const active = settings.activeProfileId === p.id;
        return (
          <div key={p.id} className="grid grid-cols-[1fr_repeat(4,60px)_auto_auto] items-center gap-1.5" data-testid={`profile-row-${p.id}`}>
            <input className="kb-input !min-h-[40px] text-sm" value={p.name} onChange={(e) => upd(p.id, { name: e.target.value })} data-testid={`profile-name-${p.id}`} />
            {NUM.map((n) => (
              <input key={n.k} type="number" min="0" className="kb-input !min-h-[40px] !px-1 text-center font-mono text-sm" value={p[n.k] ?? ""} placeholder={n.optional ? "38" : undefined} title={n.optional ? "Islak pist yan rüzgâr limiti (boş = Airbus 38 kt)" : undefined} onChange={(e) => upd(p.id, { [n.k]: e.target.value === "" && n.optional ? null : Number(e.target.value) })} data-testid={`profile-${n.k}-${p.id}`} />
            ))}
            <button className={`kb-btn !min-h-[40px] !px-2 ${active ? "kb-btn-primary" : ""}`} onClick={() => setSettings((s) => ({ ...s, activeProfileId: p.id }))} title="Bu profili kullan" data-testid={`profile-activate-${p.id}`}><Check size={14} /></button>
            <button className="kb-btn kb-btn-danger !min-h-[40px] !px-2" onClick={() => del(p.id)} title="Profili sil" data-testid={`profile-delete-${p.id}`}><Trash2 size={14} /></button>
          </div>
        );
      })}
    </div>
  );
}
