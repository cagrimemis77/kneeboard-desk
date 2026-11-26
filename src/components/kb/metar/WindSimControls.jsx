import { Slider } from "@/components/ui/slider";
import { FlaskConical, X } from "lucide-react";

export default function WindSimControls({ sim, setSim, onStart }) {
  if (!sim)
    return (
      <button className="kb-btn mt-4 w-full border-dashed" onClick={onStart} data-testid="wind-sim-start">
        <FlaskConical size={16} className="text-sky-400" />Rüzgâr Simülasyonu (Ne Olur?)
      </button>
    );
  const set = (p) => setSim({ ...sim, ...p });
  return (
    <div className="mt-4 rounded-md border border-sky-500/50 bg-sky-500/5 p-3" data-testid="wind-sim-panel">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold tracking-widest text-sky-400 kb-blink">SİMÜLASYON · METAR DEĞİL</span>
        <button className="kb-btn !min-h-[40px] !px-3 text-xs" onClick={() => setSim(null)} data-testid="wind-sim-stop"><X size={14} />METAR'a Dön</button>
      </div>
      <p className="mt-1 text-xs text-slate-400">Yönü değiştirmek için pusulaya dokunun veya sürükleyin.</p>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="kb-label">Yön</span>
          <div className="mt-1 font-mono text-lg text-slate-100" data-testid="wind-sim-dir">{String(sim.dir).padStart(3, "0")}°</div>
          <Slider value={[sim.dir]} min={0} max={355} step={5} onValueChange={([v]) => set({ dir: v })} className="mt-2" data-testid="wind-sim-dir-slider" />
        </label>
        <label className="block">
          <span className="kb-label">Hız</span>
          <div className="mt-1 font-mono text-lg text-slate-100" data-testid="wind-sim-speed">{sim.speed} kt</div>
          <Slider value={[sim.speed]} min={0} max={60} step={1} onValueChange={([v]) => set({ speed: v, gust: sim.gust !== null && sim.gust <= v ? null : sim.gust })} className="mt-2" data-testid="wind-sim-speed-slider" />
        </label>
        <label className="block">
          <span className="kb-label">Hamle (Gust)</span>
          <div className="mt-1 font-mono text-lg text-amber-300" data-testid="wind-sim-gust">{sim.gust ? `G${sim.gust} kt` : "Yok"}</div>
          <Slider value={[sim.gust ?? sim.speed]} min={sim.speed} max={80} step={1} onValueChange={([v]) => set({ gust: v > sim.speed ? v : null })} className="mt-2" data-testid="wind-sim-gust-slider" />
        </label>
      </div>
    </div>
  );
}
