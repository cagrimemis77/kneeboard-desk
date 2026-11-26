import { useState } from "react";
import { History, RefreshCw, RotateCcw, Loader2 } from "lucide-react";
import { listBackups } from "@/lib/drive";

export default function BackupHistory({ drive }) {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setList(await listBackups(drive.cfg));
    } catch (e) {
      setError(e.message || "Liste alınamadı");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-md border border-[#1E293B]" data-testid="backup-history">
      <div className="flex min-h-[44px] items-center justify-between gap-2 px-3">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-200"><History size={15} />Yedek Geçmişi (son 10 gün)</span>
        <button className="kb-btn !min-h-[38px] !px-3 text-xs" onClick={load} disabled={loading} data-testid="backup-history-load">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}{list ? "Yenile" : "Listele"}
        </button>
      </div>
      {error && <p className="border-t border-[#1E293B] px-3 py-2 text-xs text-rose-400" data-testid="backup-history-error">{error}</p>}
      {list && (
        <ul className="border-t border-[#1E293B]">
          {list.map((b, i) => (
            <li key={b.id} className="flex items-center gap-2 border-b border-[#1E293B]/50 px-3 py-1.5 last:border-0" data-testid={`backup-row-${b.id}`}>
              <div className="min-w-0 flex-1">
                <div className="font-mono text-xs text-slate-100">
                  {new Date(b.savedAt).toLocaleString("tr-TR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  {i === 0 && <span className="ml-2 rounded-sm bg-emerald-500/15 px-1 text-[10px] text-emerald-400">EN YENİ</span>}
                </div>
                <div className="font-mono text-[10px] text-slate-500">{b.device?.name || "Bilinmeyen cihaz"}{b.device?.id === drive.cfg.deviceId ? " (bu cihaz)" : ""} · {Math.max(1, Math.round((b.size || 0) / 1024))} KB</div>
              </div>
              <button className="kb-btn !min-h-[38px] !px-2.5 text-xs" disabled={drive.busy} onClick={() => drive.restore(b.id)} data-testid={`backup-restore-${b.id}`}><RotateCcw size={14} />Bu Yedeğe Dön</button>
            </li>
          ))}
          {!list.length && <li className="px-3 py-3 text-center text-xs text-slate-500">Henüz yedek yok.</li>}
        </ul>
      )}
    </div>
  );
}
