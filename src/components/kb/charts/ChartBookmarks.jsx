import { useState } from "react";
import { Star, ExternalLink, Eye, Trash2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export default function ChartBookmarks({ bookmarks, icao, onAdd, onDelete, onView }) {
  const [f, setF] = useState({ label: "", url: "" });
  const [q, setQ] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!f.label.trim() || !/^https?:\/\//i.test(f.url.trim())) return toast.error("Etiket ve http(s) ile başlayan bir bağlantı girin");
    const m = f.label.trim().toUpperCase().match(/^([A-Z]{4})\b/);
    onAdd({ label: f.label.trim(), url: f.url.trim(), icao: m ? m[1] : icao });
    setF({ label: "", url: "" });
    toast.success("Chart bağlantısı kaydedildi");
  };
  const term = q.trim().toLocaleLowerCase("tr");
  const list = bookmarks.filter((b) => !term || `${b.label} ${b.icao}`.toLocaleLowerCase("tr").includes(term));

  return (
    <section className="kb-card p-4 sm:p-6" data-testid="chart-bookmarks">
      <span className="flex items-center gap-1.5 kb-label"><Star size={13} />Kayıtlı Chart Bağlantıları</span>
      <form onSubmit={submit} className="mt-3 space-y-2">
        <input className="kb-input" value={f.label} onChange={(e) => setF({ ...f, label: e.target.value })} placeholder="Etiket (ör. LTFM ILS 35L)" data-testid="bookmark-label-input" />
        <div className="flex gap-2">
          <input className="kb-input font-mono text-xs" value={f.url} onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://…" data-testid="bookmark-url-input" />
          <button type="submit" className="kb-btn kb-btn-primary shrink-0" data-testid="bookmark-add-button"><Plus size={16} />Kaydet</button>
        </div>
      </form>
      {bookmarks.length > 3 && (
        <div className="relative mt-3">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input className="kb-input !pl-8 text-sm" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Favorilerde ara…" data-testid="bookmark-search-input" />
        </div>
      )}
      <ul className="mt-3 space-y-1.5">
        {list.map((b) => (
          <li key={b.id} className="flex items-center gap-1 rounded-md border border-[#1E293B] bg-[#0B0F19] p-1 pl-3" data-testid={`bookmark-${b.id}`}>
            <a href={b.url} target="_blank" rel="noopener noreferrer" className="flex min-h-[40px] min-w-0 flex-1 flex-col justify-center" data-testid={`bookmark-open-${b.id}`}>
              <span className="truncate text-sm font-semibold text-slate-100">{b.label}</span>
              <span className="truncate font-mono text-[10px] text-slate-500">{b.url}</span>
            </a>
            <button className="kb-btn !min-h-[40px] !px-2" onClick={() => onView({ name: b.label, url: b.url })} title="Uygulamada aç (site izin veriyorsa)" data-testid={`bookmark-view-${b.id}`}><Eye size={16} /></button>
            <a className="kb-btn !min-h-[40px] !px-2" href={b.url} target="_blank" rel="noopener noreferrer" title="Yeni sekmede aç"><ExternalLink size={16} /></a>
            <button className="kb-btn kb-btn-danger !min-h-[40px] !px-2" onClick={() => onDelete(b.id)} title="Sil" data-testid={`bookmark-delete-${b.id}`}><Trash2 size={16} /></button>
          </li>
        ))}
        {!bookmarks.length && <li className="py-4 text-center text-sm text-slate-500" data-testid="bookmarks-empty">Henüz kayıtlı chart yok.</li>}
      </ul>
    </section>
  );
}
