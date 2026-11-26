import { useMemo, useRef, useState } from "react";
import { Radio, Loader2, AlertTriangle, ClipboardPaste } from "lucide-react";
import { toast } from "sonner";
import { parseMetar } from "@/lib/metar";
import { effectiveSettings } from "@/lib/store";
import MetarDecoded from "./MetarDecoded";
import RunwayPanel from "./RunwayPanel";

const QUICK = ["LTFM", "LTFJ", "LTBA", "LTAC", "LTAI", "LTBJ"];

export default function MetarTab({ state, setState }) {
  const m = state.metar;
  const setM = (p) => setState((s) => ({ ...s, metar: { ...s.metar, ...p } }));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const rawRef = useRef(null);
  const parsed = useMemo(() => parseMetar(m.raw), [m.raw]);

  const fail = (msg) => {
    setError(msg);
    toast.error("Canlı METAR alınamadı");
    setTimeout(() => rawRef.current?.focus(), 50);
  };

  const fetchMetar = async (code = m.icao) => {
    const icao = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(icao)) return fail("Geçerli bir 4 harfli ICAO kodu girin.");
    setM({ icao });
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`https://metar.vatsim.net/metar.php?id=${icao}`);
      const text = (await res.text()).trim().split("\n")[0];
      if (!res.ok || !text.toUpperCase().startsWith(icao)) throw new Error();
      setM({ raw: text, icao });
      toast.success(`${icao} METAR güncellendi`);
    } catch {
      fail(`${icao} için canlı METAR alınamadı. Lütfen ham METAR'ı aşağıdaki kutuya yapıştırın.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] kb-rise" data-testid="metar-tab">
      <div className="space-y-5">
        <section className="kb-card p-4 sm:p-6">
          <span className="kb-label">Canlı METAR · VATSIM</span>
          <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); fetchMetar(); }}>
            <input className="kb-input flex-1 font-mono text-lg uppercase tracking-widest" maxLength={4} value={m.icao} onChange={(e) => setM({ icao: e.target.value.toUpperCase() })} placeholder="ICAO" data-testid="input-icao-search" />
            <button type="submit" className="kb-btn kb-btn-primary" disabled={loading} data-testid="btn-fetch-metar">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Radio size={18} />}METAR Getir
            </button>
          </form>
          <div className="mt-3 flex flex-wrap gap-2">
            {QUICK.map((q) => (
              <button key={q} className="kb-btn !min-h-[40px] !px-3 font-mono text-xs" onClick={() => fetchMetar(q)} data-testid={`quick-icao-${q}`}>{q}</button>
            ))}
          </div>
          {error && (
            <div className="mt-4 flex gap-3 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300" data-testid="metar-fetch-error">
              <AlertTriangle size={18} className="mt-0.5 shrink-0" />{error}
            </div>
          )}
          <div className="mt-5">
            <label className="mb-2 flex items-center gap-2 kb-label"><ClipboardPaste size={14} />Ham METAR Yapıştır</label>
            <textarea
              ref={rawRef}
              rows={3}
              className="kb-input resize-y font-mono text-sm text-emerald-300"
              value={m.raw}
              onChange={(e) => setM({ raw: e.target.value })}
              placeholder="LTFM 260150Z 21018G28KT 9999 FEW035 14/06 Q1018"
              data-testid="textarea-raw-metar"
            />
          </div>
        </section>
        <MetarDecoded parsed={parsed} />
      </div>
      <RunwayPanel
        parsed={parsed}
        metar={m}
        setM={setM}
        settings={effectiveSettings(state.settings)}
        selectProfile={(id) => setState((s) => ({ ...s, settings: { ...s.settings, activeProfileId: id } }))}
        selectSurface={(id) => setState((s) => ({ ...s, settings: { ...s.settings, runwaySurface: id } }))}
        profiles={state.settings.aircraftProfiles || []}
        activeProfileId={state.settings.activeProfileId}
        airport={parsed?.station || m.icao}
        presets={state.runwayPresets}
        setPresets={(fn) => setState((s) => ({ ...s, runwayPresets: fn(s.runwayPresets) }))}
      />
    </div>
  );
}
