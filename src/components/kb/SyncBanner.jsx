import { CloudDownload, X, MonitorSmartphone } from "lucide-react";

export default function SyncBanner({ drive }) {
  const n = drive.newer;
  if (!n) return null;
  return (
    <div className="border-b border-amber-500/40 bg-amber-500/10 print:hidden" data-testid="sync-banner">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-3 py-2 sm:px-6">
        <MonitorSmartphone size={18} className="text-amber-400" />
        <span className="flex-1 text-sm text-amber-200">
          Drive'da <b>{n.device}</b> cihazından daha yeni bir yedek var · <span className="font-mono">{new Date(n.savedAt).toLocaleString("tr-TR")}</span>
        </span>
        <button className="kb-btn kb-btn-primary !min-h-[40px]" onClick={drive.loadNewer} disabled={drive.busy} data-testid="sync-banner-load"><CloudDownload size={16} />Yedeği Yükle</button>
        <button className="kb-btn !min-h-[40px] !px-3" onClick={drive.dismissNewer} title="Yoksay" data-testid="sync-banner-dismiss"><X size={16} />Yoksay</button>
      </div>
    </div>
  );
}
