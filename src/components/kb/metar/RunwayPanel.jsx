import { useState } from "react";
import { ShieldCheck, ShieldAlert, OctagonAlert, Minus, Plus, ArrowLeftRight } from "lucide-react";
import { reciprocalRunway, assessWind, resolveHeading, runwayWind, evalWind } from "@/lib/metar";
import WindCompass from "./WindCompass";
import RunwayPresets from "./RunwayPresets";
import LimitProfilePicker from "./LimitProfilePicker";
import WindSimControls from "./WindSimControls";
import SurfacePicker from "./SurfacePicker";

const LEVEL = {
  ok: { cls: "border-emerald-500/50 bg-emerald-500/10 text-emerald-400", Icon: ShieldCheck },
  caution: { cls: "border-amber-500/50 bg-amber-500/10 text-amber-400", Icon: ShieldAlert },
  danger: { cls: "border-rose-500/60 bg-rose-500/10 text-rose-400", Icon: OctagonAlert },
};

const Comp = ({ label, value, sub, cls, testid }) => (
  <div className="rounded-md border border-[#1E293B] bg-[#0B0F19] p-3" data-testid={testid}>
    <div className="kb-label">{label}</div>
    <div className={`mt-1 font-mono text-2xl font-bold ${cls}`}>{value}<span className="text-sm text-slate-500"> kt</span></div>
    {sub && <div className="font-mono text-xs text-slate-400">{sub}</div>}
  </div>
);

export default function RunwayPanel({ parsed, metar, setM, settings, airport, presets, setPresets, profiles, activeProfileId, selectProfile, selectSurface }) {
  const { rwy, override, heading } = resolveHeading(metar);
  const [sim, setSim] = useState(null);
  const pw = parsed?.wind;
  const startSim = () => setSim({ dir: pw?.dir ?? heading ?? 0, speed: pw?.speed ?? 15, gust: null, variable: false });
  const w = sim || pw;
  const rw = runwayWind(w, heading);
  const hasWind = !!rw;
  const comp = rw?.comp;
  const gustComp = rw?.gustComp;
  const evalComp = rw && evalWind(rw, settings);
  const alert = evalComp && assessWind(evalComp, settings);
  const step = (d) => {
    const n = rwy ? ((rwy.number - 1 + d + 36) % 36) + 1 : 36;
    setM({ runway: `${String(n).padStart(2, "0")}${rwy?.side || ""}`, headingOverride: "" });
  };
  const r = (v) => Math.round(Math.abs(v));

  return (
    <section className="kb-card p-4 sm:p-6" data-testid="runway-panel">
      <span className="kb-label">Pist & Rüzgâr Bileşenleri</span>
      <LimitProfilePicker profiles={profiles} activeId={activeProfileId} onSelect={selectProfile} settings={settings} />
      <SurfacePicker value={settings.runwaySurface} onSelect={selectSurface} settings={settings} />
      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1fr]">
        <div className="flex gap-2">
          <button className="kb-btn !px-3" onClick={() => step(-1)} title="Önceki pist" data-testid="runway-step-down"><Minus size={16} /></button>
          <input className="kb-input text-center font-mono text-xl uppercase" maxLength={3} value={metar.runway} onChange={(e) => setM({ runway: e.target.value.toUpperCase(), headingOverride: "" })} placeholder="35L" data-testid="input-runway-heading" />
          <button className="kb-btn !px-3" onClick={() => step(1)} title="Sonraki pist" data-testid="runway-step-up"><Plus size={16} /></button>
        </div>
        <div className="flex gap-2">
          <input className="kb-input font-mono" type="number" min="0" max="360" value={metar.headingOverride} onChange={(e) => setM({ headingOverride: e.target.value })} placeholder={`Tam pist başı ${rwy ? rwy.heading + "°" : "(°)"}`} data-testid="input-runway-exact-heading" />
          {rwy && <button className="kb-btn !px-3 font-mono" onClick={() => setM({ runway: reciprocalRunway(rwy), headingOverride: "" })} title="Ters pist" data-testid="runway-reciprocal"><ArrowLeftRight size={16} />{reciprocalRunway(rwy)}</button>}
        </div>
      </div>
      {!rwy && !override && <p className="mt-2 text-sm text-amber-400" data-testid="runway-invalid">Geçerli pist girin (01–36, isteğe bağlı L/C/R).</p>}
      <RunwayPresets airport={airport} presets={presets} setPresets={setPresets} current={metar.runway} override={metar.headingOverride} onSelect={(p) => setM({ runway: p.d, headingOverride: p.hdg ?? "" })} wind={w} settings={settings} />

      <WindSimControls sim={sim} setSim={setSim} onStart={startSim} />

      <div className="my-5 flex justify-center">
        <WindCompass heading={heading} wind={w} simulated={!!sim} onPickDir={sim ? (dir) => setSim((s) => ({ ...s, dir })) : null} runwayLabel={rwy ? metar.runway : override ? `${Math.round(heading)}°` : ""} reciprocal={rwy ? reciprocalRunway(rwy) : ""} />
      </div>
      {heading !== undefined && (
        <p className="-mt-3 mb-4 text-center font-mono text-xs text-slate-500" data-testid="runway-effective-heading">
          HESAP YÖNÜ <span className={override ? "text-amber-400" : "text-slate-300"}>{Math.round(heading)}°</span> {override ? "· TAM YÖN" : "· PİST NUMARASINDAN"}
        </p>
      )}

      {hasWind ? (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Comp
              label={comp.head >= 0 ? "Baş Rüzgârı (Headwind)" : "Arka Rüzgâr (Tailwind)"}
              value={r(comp.head)}
              sub={gustComp ? `Hamle: ${r(gustComp.head)} kt ${gustComp.head >= 0 ? "baş" : "arka"}` : null}
              cls={comp.head >= 0 ? "text-emerald-400" : "text-amber-400"}
              testid="wind-headwind-value"
            />
            <Comp
              label={`Yan Rüzgâr (Crosswind) ${r(comp.cross) === 0 ? "" : comp.cross > 0 ? "· Sağdan" : "· Soldan"}`}
              value={r(comp.cross)}
              sub={gustComp ? `Hamle: ${r(gustComp.cross)} kt` : null}
              cls={Math.abs(evalComp.cross) > settings.maxCrosswind ? "text-rose-400" : Math.abs(evalComp.cross) > settings.cautionCrosswind ? "text-amber-400" : "text-sky-400"}
              testid="wind-crosswind-value"
            />
          </div>
          {w.variable && <p className="mt-2 text-xs text-amber-300">VRB rüzgâr: en kötü durum olarak tam yan rüzgâr varsayıldı.</p>}
          {(() => {
            const { cls, Icon } = LEVEL[alert.level];
            return (
              <div className={`mt-4 flex items-center gap-3 rounded-md border p-4 ${cls}`} data-testid="wind-alert-banner" data-level={alert.level}>
                <Icon size={24} className="shrink-0" />
                <div>
                  <div className="font-mono text-sm font-bold tracking-widest">{alert.title}</div>
                  <div className="text-sm text-slate-300">{alert.msg}</div>
                </div>
              </div>
            );
          })()}
          <p className="mt-3 font-mono text-[11px] text-slate-500">
            LİMİTLER ({settings.profileName} · {settings.surface.label}) · XWIND UYARI {settings.cautionCrosswind} kt · MAKS {settings.maxCrosswind} kt · TAILWIND MAKS {settings.maxTailwind} kt {settings.useGust ? "· HAMLE DAHİL" : ""}
          </p>
        </>
      ) : (
        <p className="text-center text-sm text-slate-500">Rüzgâr bileşenleri için METAR ve pist girin.</p>
      )}
    </section>
  );
}
