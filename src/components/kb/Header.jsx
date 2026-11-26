import { useEffect, useRef, useState } from "react";
import { Download, Upload, Settings, Printer, CloudUpload, Loader2 } from "lucide-react";

const LOGO_URL = "https://customer-assets-jt897jd0.emergentagent.net/job_kneeboard-desk--1sakhxhy/artifacts/a803df9d9feea476_Gemini_Generated_Image_2f9ba2f9ba2f9ba2__1_-removebg-preview.png";
import { toast } from "sonner";
import { mergeState, buildBackup } from "@/lib/store";
import { isConfigured } from "@/lib/drive";

const DriveButton = ({ drive, onClick }) => {
  const c = drive.cfg;
  const ready = isConfigured(c);
  const dot = !ready ? "bg-slate-600" : c.lastError ? "bg-rose-500" : c.auto ? "bg-emerald-400" : "bg-amber-400";
  const time = c.lastSync ? new Date(c.lastSync).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" }) : null;
  const title = !ready ? "Drive yedekleme yapılandırılmadı" : c.lastError ? `Son hata: ${c.lastError}` : c.auto ? "Otomatik yedekleme aktif" : "Otomatik yedekleme kapalı";
  return (
    <button className="kb-btn !px-3" onClick={onClick} title={title} data-testid="btn-drive-status">
      {drive.busy ? <Loader2 size={16} className="animate-spin text-sky-400" /> : <span className={`h-2.5 w-2.5 rounded-full ${dot} ${ready && c.auto && !c.lastError ? "shadow-[0_0_8px_#10B981]" : ""}`} />}
      <CloudUpload size={16} />
      <span className="hidden sm:inline">Drive Yedek</span>
      {time && <span className="font-mono text-xs text-slate-400" data-testid="drive-last-sync-time">{time}</span>}
    </button>
  );
};

const ZuluClock = () => {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="hidden items-center gap-2 rounded-md border border-[#1E293B] bg-[#0B0F19] px-3 py-2 md:flex" data-testid="zulu-clock">
      <span className="h-2 w-2 rounded-full bg-emerald-400 kb-blink" />
      <span className="font-mono text-sm text-emerald-400">{now.toISOString().slice(11, 19)}Z</span>
      <span className="kb-label">UTC</span>
    </div>
  );
};

export default function Header({ state, setState, onOpenSettings, drive, onOpenDrive }) {
  const fileRef = useRef(null);

  const exportJson = () => {
    const payload = buildBackup(state);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `av_kneeboard_yedek_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Yedek dosyası indirildi");
  };

  const importJson = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data || typeof data !== "object" || (!data.checklists && !data.logs)) throw new Error();
        setState(mergeState(data));
        toast.success("Yedek başarıyla yüklendi");
      } catch {
        toast.error("Geçersiz yedek dosyası");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <header className="border-b border-[#1E293B] bg-[#0B0F19]">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-3 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <img src={LOGO_URL} alt="Digital Kneeboard Logo" className="w-9 h-9 rounded-xl object-cover shrink-0" data-testid="app-logo" />
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight text-slate-100 sm:text-xl" data-testid="app-title">Dijital Kneeboard</h1>
            <p className="kb-label">Simülasyon Brifing Masası</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ZuluClock />
          <DriveButton drive={drive} onClick={onOpenDrive} />
          <button className="kb-btn" onClick={() => window.print()} title="Aktif kontrol listesi ve METAR brifingini yazdır" data-testid="btn-print-kneeboard">
            <Printer size={18} /><span className="hidden lg:inline">Kneeboard Yazdır</span>
          </button>
          <button className="kb-btn" onClick={exportJson} title="Tüm verileri JSON olarak indir" data-testid="btn-backup-download">
            <Download size={18} /><span className="hidden lg:inline">JSON Yedek İndir</span>
          </button>
          <button className="kb-btn" onClick={() => fileRef.current?.click()} title="JSON yedek dosyasını yükle" data-testid="btn-backup-upload">
            <Upload size={18} /><span className="hidden lg:inline">Yedek Yükle</span>
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={importJson} data-testid="input-backup-file" />
          <button className="kb-btn" onClick={onOpenSettings} title="Limit ve kokpit ayarları" data-testid="btn-open-settings">
            <Settings size={18} /><span className="hidden lg:inline">Ayarlar</span>
          </button>
        </div>
      </div>
    </header>
  );
}
