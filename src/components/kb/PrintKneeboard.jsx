import { parseMetar, resolveHeading, runwayWind, evalWind, assessWind, rankRunways } from "@/lib/metar";
import { effectiveSettings } from "@/lib/store";

const r = (v) => Math.round(Math.abs(v));
const Row = ({ k, v }) => (
  <div className="flex justify-between border-b border-dotted border-slate-400 py-0.5">
    <span className="text-slate-600">{k}</span>
    <span className="font-mono font-bold">{v ?? "—"}</span>
  </div>
);

const MetarBlock = ({ state }) => {
  const s = effectiveSettings(state.settings);
  const p = parseMetar(state.metar.raw);
  const { rwy, override, heading } = resolveHeading(state.metar);
  const w = p?.wind;
  const rw = runwayWind(w, heading);
  const ev = rw && evalWind(rw, s);
  const alert = ev && assessWind(ev, s);
  const airport = p?.station || state.metar.icao;
  const best = rankRunways(state.runwayPresets?.[airport] || [], w, s)[0];
  return (
    <section className="mb-4 break-inside-avoid rounded border-2 border-black p-2" data-testid="print-metar-block">
      <div className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-widest">
        <span>METAR Brifingi · {airport}</span>
        <span className="font-mono">{new Date().toISOString().slice(0, 16).replace("T", " ")}Z</span>
      </div>
      <p className="mb-2 rounded bg-slate-100 p-1.5 font-mono text-[10px] leading-snug">{state.metar.raw || "—"}</p>
      {p && (
        <div className="grid grid-cols-2 gap-x-4 text-[10px]">
          <Row k="Rüzgâr" v={w ? `${w.variable ? "VRB" : String(w.dir).padStart(3, "0") + "°"}/${w.speed}${w.gust ? "G" + w.gust : ""} kt` : null} />
          <Row k="Görüş" v={p.visibility?.text} />
          <Row k="QNH" v={p.qnh ? `${p.qnh} hPa / ${p.altimeter?.toFixed(2)}` : null} />
          <Row k="T / DP" v={p.temp !== null ? `${p.temp}° / ${p.dew ?? "--"}°C` : null} />
          <Row k="Bulutlar" v={p.cavok ? "CAVOK" : p.clouds.map((c) => `${c.cover}${c.ft != null ? Math.round(c.ft / 100).toString().padStart(3, "0") : ""}${c.type || ""}`).join(" ") || null} />
          <Row k="Pist" v={rwy ? `${state.metar.runway} (${Math.round(heading)}°)` : override ? `${Math.round(heading)}°` : null} />
          {rw && <Row k={rw.comp.head >= -0.5 ? "Baş Rüzgârı" : "Arka Rüzgâr"} v={`${r(rw.comp.head)} kt${rw.gustComp ? ` (G ${r(rw.gustComp.head)})` : ""}`} />}
          {rw && <Row k="Yan Rüzgâr (Crosswind)" v={`${r(rw.comp.cross)} kt${rw.gustComp ? ` (G ${r(rw.gustComp.cross)})` : ""}`} />}
          {best && <Row k="En Uygun Pist" v={best.designator} />}
          {alert && <Row k="Durum" v={alert.title} />}
          <Row k="Limit Profili" v={`${s.profileName} · XW ${s.maxCrosswind} / TW ${s.maxTailwind} kt`} />
          <Row k="Pist Yüzeyi" v={`${s.surface.label} (RWYCC ${s.surface.rwycc})`} />
        </div>
      )}
    </section>
  );
};

const ChecklistBlock = ({ list }) => (
  <section data-testid="print-checklist-block">
    <h2 className="mb-2 border-b-2 border-black pb-1 text-[12px] font-bold uppercase leading-tight">{list.name}</h2>
    {list.phases.map((ph, pi) => (
      <div key={ph.id} className="mb-3 break-inside-avoid">
        <h3 className="mb-1 bg-black px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">{String(pi + 1).padStart(2, "0")} · {ph.name}</h3>
        {ph.items.map((it) => (
          <div key={it.id} className="flex items-baseline gap-1.5 py-[1.5px] text-[10px]">
            <span className="inline-block h-2.5 w-2.5 shrink-0 translate-y-[1px] border border-black" />
            <span className={it.critical ? "font-bold" : ""}>{it.text}{it.critical && " ▲"}</span>
            <span className="mx-0.5 flex-1 border-b border-dotted border-slate-500" />
            <span className="shrink-0 font-mono font-bold">{it.action}</span>
          </div>
        ))}
      </div>
    ))}
    <p className="mt-2 text-[8px] text-slate-500">▲ = KRİTİK madde</p>
  </section>
);

export default function PrintKneeboard({ state }) {
  const list = state.checklists.find((c) => c.id === state.activeChecklistId) || state.checklists[0];
  return (
    <div className="hidden bg-white text-black print:block" data-testid="print-kneeboard">
      <header className="mb-3 flex items-end justify-between border-b-4 border-black pb-1">
        <span className="text-[14px] font-bold tracking-tight">DİJİTAL KNEEBOARD</span>
        <span className="text-[9px] uppercase tracking-widest">Simülasyon Brifing Kartı</span>
      </header>
      <MetarBlock state={state} />
      <ChecklistBlock list={list} />
    </div>
  );
}
