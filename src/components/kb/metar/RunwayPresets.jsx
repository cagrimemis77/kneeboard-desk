import { useState } from "react";
import { BookmarkPlus, X, Settings2, Trophy } from "lucide-react";
import { toast } from "sonner";
import { parseRunway, formatRunway, rankRunways, normPreset } from "@/lib/metar";

const r = (v) => Math.round(Math.abs(v));
const side = (c) => (r(c) === 0 ? "" : c > 0 ? " sağdan" : " soldan");

export const describe = (x) => `${x.ev.head >= -0.5 ? "Baş" : "Arka"} ${r(x.ev.head)} kt · Yan ${r(x.ev.cross)} kt${side(x.ev.cross)}`;

export default function RunwayPresets({ airport, presets, setPresets, current, override, onSelect, wind, settings }) {
  const [manage, setManage] = useState(false);
  const list = (presets[airport] || []).map(normPreset);
  const ranked = rankRunways(list, wind, settings);
  const best = ranked[0];
  const write = (fn) => setPresets((p) => ({ ...p, [airport]: fn((p[airport] || []).map(normPreset)) }));
  const curRwy = parseRunway(current);
  const curD = curRwy && formatRunway(curRwy);

  const save = () => {
    if (!curRwy) return toast.error("Önce geçerli bir pist girin");
    const hdg = override !== "" && override != null && !isNaN(Number(override)) ? ((Number(override) % 360) + 360) % 360 : null;
    const exists = list.some((x) => x.d === curD);
    write((l) => (exists ? l.map((x) => (x.d === curD ? { ...x, hdg } : x)) : [...l, { d: curD, hdg }]));
    toast.success(`${airport} · ${curD}${hdg !== null ? ` (${hdg}°)` : ""} ${exists ? "güncellendi" : "kaydedildi"}`);
  };
  const remove = (d) => write((l) => l.filter((x) => x.d !== d));
  const setHdg = (d, v) => write((l) => l.map((x) => (x.d === d ? { ...x, hdg: v === "" ? null : ((Number(v) % 360) + 360) % 360 } : x)));

  return (
    <div className="mt-4 space-y-3" data-testid="runway-presets">
      <div className="flex items-center justify-between gap-2">
        <span className="kb-label">Kayıtlı Pistler · <span className="text-sky-400">{airport || "----"}</span></span>
        <div className="flex gap-2">
          <button className="kb-btn !min-h-[40px] !px-3 text-xs" onClick={save} disabled={!airport} title="Girilen pisti (ve varsa tam yönünü) kaydet" data-testid="runway-preset-save"><BookmarkPlus size={16} />Pisti Kaydet</button>
          {list.length > 0 && (
            <button className={`kb-btn !min-h-[40px] !px-3 ${manage ? "kb-btn-primary" : ""}`} onClick={() => setManage(!manage)} title="Kayıtlı pistleri düzenle" data-testid="runway-preset-manage"><Settings2 size={16} /></button>
          )}
        </div>
      </div>
      {list.length === 0 ? (
        <p className="text-sm text-slate-500" data-testid="runway-preset-empty">Bu havalimanı için kayıtlı pist yok — pist girip "Pisti Kaydet"e basın.</p>
      ) : manage ? (
        <div className="grid gap-2 sm:grid-cols-2" data-testid="runway-preset-manage-list">
          {list.map((p) => (
            <div key={p.d} className="flex items-center gap-2 rounded-md border border-[#1E293B] bg-[#0B0F19] p-1.5">
              <span className="w-12 text-center font-mono font-bold text-slate-100">{p.d}</span>
              <input type="number" min="0" max="360" className="kb-input !min-h-[40px] font-mono" value={p.hdg ?? ""} onChange={(e) => setHdg(p.d, e.target.value)} placeholder={`Tam yön (${parseRunway(p.d)?.heading}°)`} data-testid={`runway-preset-heading-${p.d}`} />
              <button onClick={() => remove(p.d)} className="kb-btn kb-btn-danger !min-h-[40px] !px-2" title={`${p.d} sil`} data-testid={`runway-preset-remove-${p.d}`}><X size={14} /></button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {list.map((p) => (
            <button key={p.d} onClick={() => onSelect(p)} data-testid={`runway-preset-${p.d}`} className={`kb-btn !min-h-[42px] !gap-1.5 !px-3 font-mono ${curD === p.d ? "kb-btn-primary" : ""} ${best?.designator === p.d ? "!border-emerald-500/60" : ""}`}>
              {p.d}{p.hdg !== null && <span className="text-[10px] font-normal text-slate-500">{p.hdg}°</span>}
            </button>
          ))}
        </div>
      )}

      {best && (
        <div className={`rounded-md border p-3 ${best.tail ? "border-amber-500/50 bg-amber-500/5" : "border-emerald-500/50 bg-emerald-500/5"}`} data-testid="best-runway-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <Trophy size={20} className={best.tail ? "text-amber-400" : "text-emerald-400"} />
              <div>
                <div className="kb-label">En Uygun Pist</div>
                <div className="font-mono text-2xl font-bold text-slate-100" data-testid="best-runway-designator">{best.designator}<span className="ml-1.5 text-xs font-normal text-slate-500">{best.heading}°</span></div>
              </div>
              <div className="font-mono text-xs text-slate-300">{describe(best)}</div>
            </div>
            {curD !== best.designator && (
              <button className="kb-btn kb-btn-primary" onClick={() => onSelect({ d: best.designator, hdg: best.hdg })} data-testid="best-runway-select">Bu Pisti Seç</button>
            )}
          </div>
          {best.tail && <p className="mt-2 text-xs text-amber-300">Tüm kayıtlı pistlerde arka rüzgâr var — en düşük arka rüzgârlı pist gösteriliyor.</p>}
          {wind?.variable && <p className="mt-2 text-xs text-amber-300">VRB rüzgâr: tüm pistler eşit kabul edildi.</p>}
          {ranked.length > 1 && (
            <ol className="mt-3 space-y-1 border-t border-[#1E293B] pt-2" data-testid="runway-ranking">
              {ranked.slice(1, 5).map((x, i) => (
                <li key={x.designator} className="flex justify-between font-mono text-xs text-slate-400">
                  <span><span className="text-slate-600">{i + 2}.</span> {x.designator} <span className="text-slate-600">{x.heading}°</span></span>
                  <span className={x.tail ? "text-amber-400" : ""}>{describe(x)}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
