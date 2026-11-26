import { useMemo, useState } from "react";
import { Search, Trash2, BookOpen, Pencil, ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { landingRating } from "@/lib/store";

const FILTERS = [
  { key: "all", label: "Tümü" },
  { key: "soft", label: "Yumuşak" },
  { key: "normal", label: "Normal" },
  { key: "hard", label: "Sert" },
];

const COLS = [
  { label: "Tarih", key: "date", first: "desc" },
  { label: "Rota" },
  { label: "Tip" },
  { label: "Süre", key: "duration", first: "desc" },
  { label: "İniş", key: "fpm", first: "asc" },
  { label: "Yakıt", key: "fuel", first: "desc" },
  { label: "Notlar" },
  { label: "" },
];
const sortVal = (l, k) => (k === "date" ? l.date || "" : k === "fpm" ? Math.abs(Number(l.fpm)) : Number(l[k]) || 0);

export default function LogTable({ logs, settings, onDelete, onEdit, editingId }) {
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState({ key: "date", dir: "desc" });
  const toggleSort = (c) => setSort((s) => (s.key === c.key ? { key: c.key, dir: s.dir === "asc" ? "desc" : "asc" } : { key: c.key, dir: c.first }));
  const rows = useMemo(() => {
    const term = q.trim().toLocaleLowerCase("tr");
    const m = sort.dir === "asc" ? 1 : -1;
    return logs
      .filter((l) => filter === "all" || landingRating(l.fpm, settings).key === filter)
      .filter((l) => !term || [l.dep, l.arr, l.type, l.notes, l.date].join(" ").toLocaleLowerCase("tr").includes(term))
      .sort((a, b) => {
        const va = sortVal(a, sort.key), vb = sortVal(b, sort.key);
        return (typeof va === "string" ? va.localeCompare(vb) : va - vb) * m;
      });
  }, [logs, q, filter, settings, sort]);

  return (
    <section className="kb-card" data-testid="logbook-table">
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1E293B] p-4">
        <div className="relative min-w-[200px] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="kb-input !pl-9" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ICAO, tip veya not ara…" data-testid="logbook-search-input" />
        </div>
        <div className="flex gap-1 rounded-md border border-[#1E293B] bg-[#0B0F19] p-1">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} data-testid={`logbook-filter-${f.key}`} className={`min-h-[40px] rounded px-3 text-sm font-semibold transition-colors ${filter === f.key ? "bg-[#1E293B] text-sky-400" : "text-slate-400 hover:text-slate-200"}`}>{f.label}</button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[#1E293B] text-left">
              {COLS.map((c) => (
                <th key={c.label} className="kb-label px-2 py-1 font-normal">
                  {c.key ? (
                    <button onClick={() => toggleSort(c)} data-testid={`logbook-sort-${c.key}`} title={c.key === "fpm" ? "İniş hızına göre sırala (yumuşaktan serte)" : `${c.label} sütununa göre sırala`} className={`flex min-h-[44px] items-center gap-1 rounded px-2 uppercase tracking-[0.18em] transition-colors hover:text-slate-200 ${sort.key === c.key ? "text-sky-400" : ""}`}>
                      {c.label}
                      {sort.key === c.key ? (sort.dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ArrowUpDown size={12} className="opacity-40" />}
                    </button>
                  ) : (
                    <span className="px-2">{c.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => {
              const r = landingRating(l.fpm, settings);
              return (
                <tr key={l.id} className={`border-b border-[#1E293B]/60 transition-colors hover:bg-[#162032] ${editingId === l.id ? "bg-amber-500/5" : ""}`} data-testid={`logbook-row-${l.id}`}>
                  <td className="px-4 py-3 font-mono text-slate-400">{l.date}</td>
                  <td className="px-4 py-3 font-mono font-bold text-slate-100">{l.dep} <span className="text-sky-500">→</span> {l.arr}</td>
                  <td className="px-4 py-3 text-slate-300">{l.type}</td>
                  <td className="px-4 py-3 font-mono text-slate-300">{l.duration} dk</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-slate-100">{l.fpm}</span>
                    <span className={`ml-2 inline-block rounded-sm border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase ${r.cls}`} data-testid={`landing-badge-${l.id}`}>{r.label}</span>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">{l.fuel != null ? `${l.fuel} kg` : "—"}</td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-slate-400" title={l.notes}>{l.notes || "—"}</td>
                  <td className="whitespace-nowrap px-2 py-1 text-right">
                    <button className="kb-btn !border-transparent !bg-transparent !px-2 hover:!text-amber-400" onClick={() => onEdit(l)} title="Kaydı düzenle" data-testid={`logbook-edit-${l.id}`}><Pencil size={16} /></button>
                    <button className="kb-btn kb-btn-danger !border-transparent !bg-transparent !px-2" onClick={() => onDelete(l.id)} title="Kaydı sil" data-testid={`logbook-delete-${l.id}`}><Trash2 size={16} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {rows.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-14 text-slate-500" data-testid="logbook-empty">
            <BookOpen size={28} />
            {logs.length ? "Filtreye uyan kayıt yok." : "Henüz kayıt yok. Soldaki formdan ilk uçuşunuzu ekleyin."}
          </div>
        )}
      </div>
    </section>
  );
}
