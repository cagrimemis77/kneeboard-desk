import { useState } from "react";
import { Search, Loader2, ExternalLink, Info, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { isUS, providersFor, fetchFaaCharts } from "@/lib/charts";
import FaaChartList from "./FaaChartList";

const QUICK = ["LTFM", "LTAC", "KJFK", "EDDF", "EGLL", "LFPG"];

export default function ChartLookup({ icao, setIcao, onView, onBookmark }) {
  const [query, setQuery] = useState(icao);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const search = async (code = query) => {
    const c = code.trim().toUpperCase();
    if (!/^[A-Z0-9]{4}$/.test(c)) return toast.error("Geçerli bir 4 harfli ICAO kodu girin");
    setQuery(c);
    setIcao(c);
    const prov = providersFor(c);
    if (!isUS(c)) return setResult({ icao: c, prov });
    setLoading(true);
    setResult({ icao: c, prov, loading: true });
    const faa = await fetchFaaCharts(c);
    setLoading(false);
    setResult({ icao: c, prov, faa, faaFailed: !faa });
    if (!faa) toast.error("FAA chart listesi alınamadı");
  };

  return (
    <section className="kb-card p-4 sm:p-6" data-testid="chart-lookup">
      <span className="kb-label">ICAO Chart & eAIP Arama</span>
      <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); search(); }}>
        <input className="kb-input flex-1 font-mono text-lg uppercase tracking-widest" maxLength={4} value={query} onChange={(e) => setQuery(e.target.value.toUpperCase())} placeholder="ICAO" data-testid="input-chart-icao" />
        <button type="submit" className="kb-btn kb-btn-primary" disabled={loading} data-testid="btn-find-charts">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}Chartları Bul
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK.map((q) => <button key={q} className="kb-btn !min-h-[40px] !px-3 font-mono text-xs" onClick={() => search(q)} data-testid={`chart-quick-${q}`}>{q}</button>)}
      </div>

      {result && (
        <div className="mt-5 space-y-3" data-testid="chart-result">
          <div className="flex items-baseline justify-between gap-2">
            <span className="font-mono text-xl font-bold text-sky-400">{result.icao}</span>
            <span className="text-xs text-slate-400">{result.faa?.airport || (isUS(result.icao) ? "ABD · FAA" : result.prov.country || "Uluslararası")}</span>
          </div>

          {isUS(result.icao) && (
            result.loading ? (
              <p className="flex items-center gap-2 text-sm text-slate-400"><Loader2 size={16} className="animate-spin" />FAA chartları yükleniyor…</p>
            ) : result.faa ? (
              <FaaChartList icao={result.icao} faa={result.faa} onView={onView} onBookmark={onBookmark} />
            ) : (
              <p className="flex gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-300" data-testid="faa-error"><AlertTriangle size={16} className="mt-0.5 shrink-0" />AviationAPI yanıt vermedi. Aşağıdaki bağlantıları kullanabilirsiniz.</p>
            )
          )}

          <div className="space-y-2">
            {result.prov.list.map((p) => (
              <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" data-testid={`chart-provider-${p.id}`}
                className={`flex min-h-[56px] items-center gap-3 rounded-md border p-3 transition-colors ${p.official ? "border-emerald-500/50 bg-emerald-500/5 hover:bg-emerald-500/10" : "border-[#1E293B] hover:border-[#334155] hover:bg-[#162032]"}`}>
                <ExternalLink size={18} className={p.official ? "text-emerald-400" : "text-sky-400"} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-100">{p.official ? "Resmî Ücretsiz eAIP / Chart Sayfasını Aç" : `${p.name} Chart Sayfasını Aç`}</span>
                  <span className="block truncate text-xs text-slate-400">{p.official ? `${p.name} · ` : ""}{p.desc}</span>
                </span>
              </a>
            ))}
          </div>
          <p className="flex gap-2 text-xs leading-relaxed text-slate-500" data-testid="chart-external-note">
            <Info size={14} className="mt-0.5 shrink-0" />
            Uluslararası AIP portalları, tarayıcı güvenlik kuralları (CORS / çerçeve engeli) nedeniyle uygulama içine gömülemez ve yeni sekmede açılır. Resmî portallar genelde ülke eAIP dizinini açar; AD 2 bölümünden {result.icao} sayfasına geçin. İndirdiğiniz PDF'i sağdaki görüntüleyicide açabilirsiniz.
          </p>
        </div>
      )}
    </section>
  );
}
