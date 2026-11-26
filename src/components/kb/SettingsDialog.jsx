import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { buildTemplates } from "@/lib/templates";
import { defaultState } from "@/lib/store";
import ProfileEditor from "./ProfileEditor";

const FIELDS = [
  { key: "cautionCrosswind", label: "Manuel · Yan Rüzgâr Uyarı Eşiği", unit: "kt" },
  { key: "maxCrosswind", label: "Manuel · Maks. Yan Rüzgâr (Crosswind)", unit: "kt" },
  { key: "maxTailwind", label: "Manuel · Maks. Arka Rüzgâr", unit: "kt" },
  { key: "wetCrosswind", label: "Manuel · Islak Pist Yan Rüzgâr (boş = 38)", unit: "kt", optional: true },
  { key: "fpmSoft", label: "Yumuşak İniş Üst Sınırı", unit: "-FPM" },
  { key: "fpmNormal", label: "Normal İniş Üst Sınırı", unit: "-FPM" },
];

export default function SettingsDialog({ open, onOpenChange, state, setState }) {
  const s = state.settings;
  const set = (key, value) => setState((st) => ({ ...st, settings: { ...st.settings, [key]: value } }));

  const restoreTemplates = () => {
    const tpl = buildTemplates();
    setState((st) => ({ ...st, checklists: [...tpl, ...st.checklists.filter((c) => !c.builtin)], activeChecklistId: tpl[0].id, activePhaseId: tpl[0].phases[0].id }));
    toast.success("Varsayılan şablonlar geri yüklendi");
  };
  const wipe = () => {
    if (!window.confirm("Tüm kontrol listeleri, defter kayıtları ve ayarlar silinecek. Emin misiniz?")) return;
    setState(defaultState());
    toast.success("Tüm veriler sıfırlandı");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1E293B] bg-[#111827] sm:max-w-2xl" data-testid="settings-dialog">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Limit & Kokpit Ayarları</DialogTitle>
          <DialogDescription className="text-slate-400">Uçak limit profilleri, manuel rüzgâr limitleri ve iniş derecelendirme eşikleri. Manuel limitler yalnızca "Manuel" profil seçiliyken kullanılır.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          {FIELDS.map((f) => (
            <label key={f.key} className="flex items-center justify-between gap-3">
              <span className="text-sm text-slate-300">{f.label}</span>
              <div className="flex items-center gap-2">
                <input type="number" min="0" className="kb-input w-24 text-right font-mono" value={s[f.key] ?? ""} onChange={(e) => set(f.key, f.optional && e.target.value === "" ? null : Number(e.target.value))} data-testid={`settings-input-${f.key}`} />
                <span className="w-12 font-mono text-xs text-slate-500">{f.unit}</span>
              </div>
            </label>
          ))}
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-300">Varsayılan Havalimanı (ICAO)</span>
            <input className="kb-input w-24 text-center font-mono uppercase" maxLength={4} value={s.defaultAirport} onChange={(e) => set("defaultAirport", e.target.value.toUpperCase())} data-testid="settings-input-defaultAirport" />
          </label>
          <div className="flex min-h-[44px] items-center justify-between gap-3">
            <span className="text-sm text-slate-300">Hesaplamada hamle (gust) değerini kullan</span>
            <Switch checked={s.useGust} onCheckedChange={(v) => set("useGust", v)} data-testid="settings-switch-gust" />
          </div>
        </div>
        <ProfileEditor settings={s} setSettings={(fn) => setState((st) => ({ ...st, settings: fn(st.settings) }))} />
        <div className="mt-2 flex flex-wrap gap-2 border-t border-[#1E293B] pt-4">
          <button className="kb-btn" onClick={restoreTemplates} data-testid="settings-restore-templates"><RotateCcw size={16} />Şablonları Geri Yükle</button>
          <button className="kb-btn kb-btn-danger" onClick={wipe} data-testid="settings-wipe-all"><Trash2 size={16} />Tüm Verileri Sil</button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
