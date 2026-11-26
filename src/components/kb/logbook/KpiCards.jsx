import { Plane, Clock, TrendingDown, Fuel } from "lucide-react";
import { landingRating } from "@/lib/store";

const Card = ({ icon: Icon, label, value, unit, accent, extra, testid }) => (
  <div className="kb-card relative overflow-hidden p-4" data-testid={testid}>
    <div className={`absolute left-0 top-0 h-full w-[3px] ${accent}`} />
    <div className="flex items-center gap-1.5 kb-label"><Icon size={13} />{label}</div>
    <div className="mt-2 font-mono text-3xl font-bold text-slate-100">{value}<span className="ml-1 text-sm font-normal text-slate-500">{unit}</span></div>
    {extra}
  </div>
);

export default function KpiCards({ logs, settings }) {
  const total = logs.length;
  const hours = logs.reduce((a, l) => a + (Number(l.duration) || 0), 0) / 60;
  const avg = total ? Math.round(logs.reduce((a, l) => a + Number(l.fpm), 0) / total) : null;
  const fuel = logs.reduce((a, l) => a + (Number(l.fuel) || 0), 0);
  const rating = avg !== null && landingRating(avg, settings);
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Card icon={Plane} label="Toplam Uçuş/Sefer" value={total} accent="bg-sky-400" testid="kpi-total-flights" />
      <Card icon={Clock} label="Toplam Süre" value={hours.toFixed(1)} unit="saat" accent="bg-emerald-500" testid="kpi-total-hours" />
      <Card
        icon={TrendingDown}
        label="Ort. İniş Hızı"
        value={avg ?? "—"}
        unit={avg !== null ? "fpm" : ""}
        accent="bg-amber-500"
        testid="kpi-avg-fpm"
        extra={rating && <span className={`mt-2 inline-block rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${rating.cls}`}>{rating.label}</span>}
      />
      <Card icon={Fuel} label="Toplam Yakıt" value={Math.round(fuel).toLocaleString("tr-TR")} unit="kg" accent="bg-slate-500" testid="kpi-total-fuel" />
    </div>
  );
}
