import { useState } from "react";
import { PlusCircle, Save, X } from "lucide-react";
import { toast } from "sonner";
import { matchProfile } from "@/lib/store";

const TYPES = ["A320 Fenix", "A321neo", "A330-900", "A350-900", "B738", "B77W", "ATR 72-600", "Talent 2", "Desiro ML"];
const empty = () => ({ date: new Date().toISOString().slice(0, 10), dep: "", arr: "", type: "", duration: "", fpm: "", fuel: "", notes: "" });

const Field = ({ label, children }) => (
  <label className="block">
    <span className="kb-label mb-1 block">{label}</span>
    {children}
  </label>
);

const toForm = (e) =>
  e ? { date: e.date, dep: e.dep, arr: e.arr, type: e.type, duration: String(e.duration), fpm: String(e.fpm), fuel: e.fuel == null ? "" : String(e.fuel), notes: e.notes || "" } : empty();

export default function LogForm({ initial, onSave, onCancel, onTypeChange, profiles }) {
  const [f, setF] = useState(() => toForm(initial));
  const matched = matchProfile(f.type, profiles);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const code = (k) => (e) => setF({ ...f, [k]: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "") });

  const submit = (e) => {
    e.preventDefault();
    if (!f.dep || !f.arr || !f.type || !f.duration || f.fpm === "") return toast.error("Kalkış, varış, tip, süre ve iniş hızı zorunludur");
    onSave({ ...f, duration: Number(f.duration), fpm: -Math.abs(Number(f.fpm)), fuel: f.fuel === "" ? null : Number(f.fuel) });
    if (!initial) setF(empty());
  };

  return (
    <form onSubmit={submit} className={`kb-card h-fit space-y-3 p-4 sm:p-6 lg:sticky lg:top-20 ${initial ? "!border-amber-500/50" : ""}`} data-testid="log-form">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-slate-100" data-testid="log-form-title">{initial ? "Kaydı Düzenle" : "Yeni Uçuş / Sefer Kaydı"}</h2>
        {initial && <span className="font-mono text-xs text-amber-400">{initial.dep} → {initial.arr}</span>}
      </div>
      <Field label="Tarih"><input type="date" className="kb-input font-mono" value={f.date} onChange={set("date")} data-testid="input-log-date" /></Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Kalkış ICAO"><input className="kb-input font-mono uppercase tracking-widest" maxLength={6} value={f.dep} onChange={code("dep")} placeholder="LTFM" data-testid="input-log-dep-icao" /></Field>
        <Field label="Varış ICAO"><input className="kb-input font-mono uppercase tracking-widest" maxLength={6} value={f.arr} onChange={code("arr")} placeholder="LTAI" data-testid="input-log-arr-icao" /></Field>
      </div>
      <Field label="Uçak / Araç Tipi">
        <input className="kb-input" list="kb-types" value={f.type} onChange={(e) => { set("type")(e); onTypeChange?.(e.target.value); }} placeholder="A320 Fenix" data-testid="input-log-type" />
        <datalist id="kb-types">{TYPES.map((t) => <option key={t} value={t} />)}</datalist>
        {matched && <span className="mt-1 block font-mono text-[11px] text-sky-400" data-testid="log-type-profile-hint">Limit profili: {matched.name} · XW {matched.max} / TW {matched.tail} kt</span>}
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Süre (dk)"><input type="number" min="1" className="kb-input font-mono" value={f.duration} onChange={set("duration")} placeholder="75" data-testid="input-log-duration" /></Field>
        <Field label="İniş (FPM)"><input type="number" className="kb-input font-mono" value={f.fpm} onChange={set("fpm")} placeholder="-150" data-testid="input-log-fpm" /></Field>
        <Field label="Yakıt (kg)"><input type="number" min="0" className="kb-input font-mono" value={f.fuel} onChange={set("fuel")} placeholder="2400" data-testid="input-log-fuel" /></Field>
      </div>
      <Field label="Notlar"><textarea rows={3} className="kb-input resize-y" value={f.notes} onChange={set("notes")} placeholder="Pist, hava durumu, gözlemler…" data-testid="input-log-notes" /></Field>
      {initial ? (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="kb-btn" onClick={onCancel} data-testid="btn-cancel-edit-log"><X size={18} />İptal</button>
          <button type="submit" className="kb-btn kb-btn-primary" data-testid="btn-update-flight-log"><Save size={18} />Kaydı Güncelle</button>
        </div>
      ) : (
        <button type="submit" className="kb-btn kb-btn-primary w-full" data-testid="btn-add-flight-log"><PlusCircle size={18} />Deftere Kaydet</button>
      )}
    </form>
  );
}
