import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { CloudUpload, CloudDownload, Eye, EyeOff, Copy, Loader2, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { isConfigured } from "@/lib/drive";
import BackupHistory from "./BackupHistory";

const SCRIPT = `const SECRET = 'BURAYA-GIZLI-ANAHTARINIZ';
const FOLDER_NAME = 'AV Kneeboard Yedekleri';
const KEEP = 10; // son 10 gün saklanır

function folder_() {
  const it = DriveApp.getFoldersByName(FOLDER_NAME);
  return it.hasNext() ? it.next() : DriveApp.createFolder(FOLDER_NAME);
}
function files_() {
  const out = [], it = folder_().getFiles();
  while (it.hasNext()) out.push(it.next());
  return out.sort((a, b) => b.getLastUpdated() - a.getLastUpdated());
}
function json_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
function meta_(f) {
  let device = {};
  try { device = JSON.parse(f.getDescription() || '{}'); } catch (e) {}
  return { id: f.getId(), name: f.getName(), savedAt: f.getLastUpdated().toISOString(), device: device, size: f.getSize() };
}
function doPost(e) {
  const body = JSON.parse(e.postData.contents);
  if (body.key !== SECRET) return json_({ ok: false, error: 'Yetkisiz' });
  const day = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  const name = 'av_kneeboard_' + day + '.json';
  const content = JSON.stringify(body.data);
  const it = folder_().getFilesByName(name);
  const f = it.hasNext() ? it.next() : folder_().createFile(name, content, MimeType.PLAIN_TEXT);
  f.setContent(content);
  f.setDescription(JSON.stringify(body.device || {}));
  files_().slice(KEEP).forEach(function (x) { x.setTrashed(true); });
  return json_({ ok: true, savedAt: new Date().toISOString() });
}
function doGet(e) {
  const p = e.parameter;
  if (p.key !== SECRET) return json_({ ok: false, error: 'Yetkisiz' });
  const list = files_();
  if (p.action === 'list') return json_({ ok: true, backups: list.map(meta_) });
  const f = p.id ? list.filter(function (x) { return x.getId() === p.id; })[0] : list[0];
  if (!f) return json_({ ok: false, error: 'Yedek bulunamadı' });
  const m = meta_(f);
  if (p.action === 'meta') { m.ok = true; return json_(m); }
  m.ok = true;
  m.data = JSON.parse(f.getBlob().getDataAsString());
  return json_(m);
}`;

export default function DriveDialog({ open, onOpenChange, drive }) {
  const { cfg, setCfg, busy, backupNow, restore } = drive;
  const [show, setShow] = useState(false);
  const ready = isConfigured(cfg);
  const badUrl = cfg.url && !/^https:\/\/script\.google\.com\//.test(cfg.url);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-[#1E293B] bg-[#111827] sm:max-w-xl" data-testid="drive-dialog">
        <DialogHeader>
          <DialogTitle className="text-slate-100">Google Drive Otomatik Yedekleme</DialogTitle>
          <DialogDescription className="text-slate-400">Kendi Google Apps Script web uygulamanız üzerinden verileri Drive'a yedekleyin ve PC ile iPad arasında eşitleyin.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <label className="block">
            <span className="kb-label mb-1 block">Apps Script Web App URL</span>
            <input className="kb-input font-mono text-xs" value={cfg.url} onChange={(e) => setCfg({ url: e.target.value.trim() })} placeholder="https://script.google.com/macros/s/…/exec" data-testid="drive-url-input" />
            {badUrl && <span className="mt-1 block text-xs text-amber-400">URL genellikle https://script.google.com/macros/s/…/exec biçimindedir.</span>}
          </label>
          <label className="block">
            <span className="kb-label mb-1 block">Gizli Anahtar (Secret Key)</span>
            <div className="flex gap-2">
              <input type={show ? "text" : "password"} className="kb-input font-mono" value={cfg.secret} onChange={(e) => setCfg({ secret: e.target.value })} placeholder="Script'teki SECRET ile aynı" autoComplete="off" data-testid="drive-secret-input" />
              <button className="kb-btn !px-3" onClick={() => setShow(!show)} title={show ? "Gizle" : "Göster"} data-testid="drive-secret-toggle">{show ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </label>
          <div className="flex min-h-[44px] items-center justify-between gap-3 rounded-md border border-[#1E293B] bg-[#0B0F19] px-3">
            <div>
              <div className="text-sm font-semibold text-slate-200">Otomatik Yedekleme Aktif</div>
              <div className="text-xs text-slate-500">Defter veya kontrol listesi değişince 3 sn sonra sessizce yedekler</div>
            </div>
            <Switch checked={cfg.auto} onCheckedChange={(v) => setCfg({ auto: v })} disabled={!ready} data-testid="drive-auto-switch" />
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button className="kb-btn kb-btn-primary" disabled={!ready || busy} onClick={() => backupNow(false)} data-testid="drive-backup-now">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />}Şimdi Drive'a Yedekle
            </button>
            <button className="kb-btn" disabled={!ready || busy} onClick={() => restore()} data-testid="drive-restore">
              <CloudDownload size={16} />Drive'dan Geri Yükle
            </button>
          </div>
          <label className="flex items-center justify-between gap-3">
            <span className="text-sm text-slate-300">Bu cihazın adı</span>
            <input className="kb-input w-40" value={cfg.deviceName} onChange={(e) => setCfg({ deviceName: e.target.value })} placeholder="iPad / PC" data-testid="drive-device-name" />
          </label>
          <div className="rounded-md border border-[#1E293B] bg-[#0B0F19] p-3 font-mono text-xs" data-testid="drive-status">
            <div className="text-slate-400">SON EŞİTLEME: <span className="text-emerald-400">{cfg.lastSync ? new Date(cfg.lastSync).toLocaleString("tr-TR") : "—"}</span></div>
            {cfg.lastError && <div className="mt-1 text-rose-400" data-testid="drive-last-error">SON HATA: {cfg.lastError}</div>}
          </div>
          <p className="text-xs text-slate-500">URL ve gizli anahtar yalnızca bu cihazın tarayıcısında saklanır; JSON yedeğine dahil edilmez. Her cihazda bir kez girin.</p>

          {ready && <BackupHistory drive={drive} />}
          <details className="group rounded-md border border-[#1E293B]" data-testid="drive-script-help">
            <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between px-3 text-sm font-semibold text-slate-200">
              Apps Script kurulumu ve kodu<ChevronDown size={16} className="transition-transform group-open:rotate-180" />
            </summary>
            <div className="space-y-2 border-t border-[#1E293B] p-3 text-xs text-slate-400">
              <ol className="list-decimal space-y-1 pl-4">
                <li>script.google.com → Yeni proje açın (veya mevcut projeyi açın), aşağıdaki kodu yapıştırın ve SECRET değerini değiştirin.</li>
                <li>Dağıt → Yeni dağıtım → Tür: Web uygulaması · Yürüten: Ben · Erişim: Herkes.</li>
                <li>Drive iznini onaylayın, verilen /exec URL'sini yukarıya yapıştırın. Kodu güncellediyseniz: Dağıt → Dağıtımları yönet → Düzenle → Yeni sürüm.</li>
                <li>Her gün tek bir yedek dosyası tutulur (gün içinde güncellenir); son 10 gün saklanır.</li>
              </ol>
              <pre className="max-h-56 overflow-auto rounded bg-[#0B0F19] p-2 font-mono text-[10px] leading-snug text-emerald-300">{SCRIPT}</pre>
              <button className="kb-btn !min-h-[40px] text-xs" onClick={() => navigator.clipboard.writeText(SCRIPT).then(() => toast.success("Kod kopyalandı"))} data-testid="drive-copy-script"><Copy size={14} />Kodu Kopyala</button>
            </div>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  );
}
