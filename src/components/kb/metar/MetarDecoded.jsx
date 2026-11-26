import { Wind, Eye, Cloud, Thermometer, Gauge, Clock } from "lucide-react";

const Cell = ({ icon: Icon, label, children, testid }) => (
  <div className="rounded-md border border-[#1E293B] bg-[#0B0F19] p-3" data-testid={testid}>
    <div className="mb-1.5 flex items-center gap-1.5 kb-label"><Icon size={13} />{label}</div>
    <div className="font-mono text-slate-100">{children}</div>
  </div>
);

const dash = <span className="text-slate-600">—</span>;

export default function MetarDecoded({ parsed }) {
  if (!parsed) return <section className="kb-card p-6 text-center text-slate-500">METAR verisi yok.</section>;
  const w = parsed.wind;
  return (
    <section className="kb-card p-4 sm:p-6" data-testid="metar-decoded">
      <div className="mb-4 flex items-center justify-between">
        <span className="kb-label">Çözümlenmiş METAR</span>
        <span className="font-mono text-lg font-bold text-sky-400" data-testid="metar-station">{parsed.station || "----"}</span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        <Cell icon={Wind} label="Rüzgâr" testid="metar-wind">
          {w ? (
            <span className="text-lg">
              {w.variable ? "VRB" : String(w.dir).padStart(3, "0") + "°"} / {w.speed}
              {w.gust && <span className="text-amber-400"> G{w.gust}</span>}
              <span className="text-xs text-slate-500"> kt</span>
              {w.range && <span className="block text-xs text-slate-400">Değişken {w.range[0]}°–{w.range[1]}°</span>}
            </span>
          ) : dash}
        </Cell>
        <Cell icon={Eye} label="Görüş" testid="metar-visibility">{parsed.visibility ? <span className="text-lg">{parsed.visibility.text}</span> : dash}</Cell>
        <Cell icon={Gauge} label="QNH" testid="metar-qnh">
          {parsed.qnh ? <span className="text-lg text-emerald-400">{parsed.qnh} <span className="text-xs text-slate-500">hPa</span><span className="block text-xs text-slate-400">{parsed.altimeter?.toFixed(2)} inHg</span></span> : dash}
        </Cell>
        <Cell icon={Thermometer} label="Sıcaklık / Çiy N." testid="metar-temp">
          {parsed.temp !== null ? <span className="text-lg">{parsed.temp}° / {parsed.dew ?? "--"}°<span className="text-xs text-slate-500"> C</span></span> : dash}
        </Cell>
        <Cell icon={Cloud} label="Bulutlar" testid="metar-clouds">
          {parsed.clouds.length ? parsed.clouds.map((c, i) => (
            <span key={i} className={`block text-sm ${["BKN", "OVC", "VV"].includes(c.cover) ? "text-amber-300" : ""}`}>
              {c.cover}{c.ft !== null && c.ft !== undefined ? ` ${c.ft} ft` : ""}{c.type ? ` ${c.type}` : ""}
              <span className="text-xs text-slate-500"> {c.label}</span>
            </span>
          )) : parsed.cavok ? <span className="text-emerald-400">CAVOK</span> : dash}
        </Cell>
        <Cell icon={Clock} label="Rapor Zamanı" testid="metar-time">
          {parsed.time ? <span className="text-lg">{parsed.time.hh}:{parsed.time.mm}Z<span className="block text-xs text-slate-400">Gün {parsed.time.day}</span></span> : dash}
        </Cell>
      </div>
      {(parsed.weather.length > 0 || parsed.trend) && (
        <div className="mt-3 space-y-1 font-mono text-xs text-slate-400">
          {parsed.weather.length > 0 && <div>Hava Olayı: <span className="text-amber-300">{parsed.weather.join(" ")}</span></div>}
          {parsed.trend && <div>Trend: <span className="text-slate-300">{parsed.trend}</span></div>}
        </div>
      )}
    </section>
  );
}
