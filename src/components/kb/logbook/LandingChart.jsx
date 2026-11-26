import { ResponsiveContainer, ComposedChart, Line, XAxis, YAxis, Tooltip, ReferenceArea, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { landingRating } from "@/lib/store";

const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);

const Tip = ({ active, payload, settings }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const r = landingRating(d.fpm, settings);
  return (
    <div className="rounded-md border border-[#1E293B] bg-[#0B0F19] p-2 font-mono text-xs shadow-lg">
      <div className="text-slate-400">{d.date} · {d.route}</div>
      <div className="mt-1 text-slate-100">{d.fpm} fpm <span className={`ml-1 rounded-sm border px-1 text-[10px] ${r.cls}`}>{r.label}</span></div>
      {d.ma !== null && <div className="text-slate-500">Son 5 ort.: {d.ma}</div>}
    </div>
  );
};

export default function LandingChart({ logs, settings }) {
  if (logs.length < 2) return null;
  const ordered = logs.map((l, i) => ({ l, i })).sort((a, b) => (a.l.date || "").localeCompare(b.l.date || "") || b.i - a.i).map((x) => x.l);
  const data = ordered.map((l, i) => {
    const win = ordered.slice(Math.max(0, i - 4), i + 1).map((x) => Number(x.fpm));
    return { n: i + 1, date: l.date, route: `${l.dep}→${l.arr}`, fpm: Number(l.fpm), ma: i >= 1 ? Math.round(avg(win)) : null };
  });
  const min = Math.min(-400, ...data.map((d) => d.fpm)) - 50;
  const recent = avg(data.slice(-5).map((d) => Math.abs(d.fpm)));
  const prev = avg(data.slice(-10, -5).map((d) => Math.abs(d.fpm)));
  const delta = prev !== null ? Math.round(prev - recent) : null;

  return (
    <section className="kb-card p-4" data-testid="landing-chart">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="kb-label">İniş Hızı Eğilimi (FPM)</span>
        {delta !== null && (
          <span className={`flex items-center gap-1 font-mono text-xs ${delta >= 0 ? "text-emerald-400" : "text-amber-400"}`} data-testid="landing-trend">
            {delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            Son 5 iniş, önceki 5'e göre {Math.abs(delta)} fpm {delta >= 0 ? "daha yumuşak" : "daha sert"}
          </span>
        )}
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
            <ReferenceArea y1={0} y2={-settings.fpmSoft} fill="#10B981" fillOpacity={0.07} />
            <ReferenceArea y1={-settings.fpmSoft} y2={-settings.fpmNormal} fill="#38BDF8" fillOpacity={0.07} />
            <ReferenceArea y1={-settings.fpmNormal} y2={min} fill="#F59E0B" fillOpacity={0.07} />
            <CartesianGrid stroke="#1E293B" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="n" tick={{ fill: "#64748B", fontSize: 11, fontFamily: "JetBrains Mono" }} stroke="#1E293B" />
            <YAxis domain={[min, 0]} tick={{ fill: "#64748B", fontSize: 11, fontFamily: "JetBrains Mono" }} stroke="#1E293B" />
            <Tooltip content={<Tip settings={settings} />} cursor={{ stroke: "#334155" }} />
            <Line type="monotone" dataKey="ma" stroke="#F59E0B" strokeWidth={1.5} strokeDasharray="5 4" dot={false} connectNulls isAnimationActive={false} />
            <Line type="monotone" dataKey="fpm" stroke="#38BDF8" strokeWidth={2} dot={{ r: 3.5, fill: "#0B0F19", stroke: "#38BDF8", strokeWidth: 2 }} activeDot={{ r: 5 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-2 flex flex-wrap gap-4 font-mono text-[10px] text-slate-500">
        <span><span className="text-sky-400">━</span> İniş hızı</span>
        <span><span className="text-amber-400">╍</span> Son 5 ortalaması</span>
        <span><span className="text-emerald-400">■</span> Yumuşak</span>
        <span><span className="text-sky-400">■</span> Normal</span>
        <span><span className="text-amber-400">■</span> Sert</span>
      </div>
    </section>
  );
}
