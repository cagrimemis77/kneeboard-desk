import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { buildBackup, mergeState } from "./store";

const KEY = "av_kneeboard_drive";
const EMPTY = { url: "", secret: "", auto: false, lastSync: null, lastError: null, deviceId: "", deviceName: "", ignoredSavedAt: null };
const guessDevice = () => (/iPad|Macintosh.*Mobile|Tablet/i.test(navigator.userAgent) || (navigator.maxTouchPoints > 1 && /Mac/.test(navigator.platform)) ? "iPad" : /iPhone|Android/i.test(navigator.userAgent) ? "Telefon" : "PC");

const loadDrive = () => {
  let c;
  try {
    c = { ...EMPTY, ...JSON.parse(localStorage.getItem(KEY) || "{}") };
  } catch {
    c = { ...EMPTY };
  }
  if (!c.deviceId) c.deviceId = Math.random().toString(36).slice(2, 10);
  if (!c.deviceName) c.deviceName = guessDevice();
  localStorage.setItem(KEY, JSON.stringify(c));
  return c;
};

export const isConfigured = (c) => !!(c.url && c.secret);

async function readJson(res) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function pushBackup(cfg, data) {
  const res = await fetch(cfg.url, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ key: cfg.secret, data, device: { id: cfg.deviceId, name: cfg.deviceName } }) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const j = await readJson(res);
  if (j && j.ok === false) throw new Error(j.error || "Sunucu reddetti");
}

const getUrl = (cfg, extra = "") => `${cfg.url}?key=${encodeURIComponent(cfg.secret)}${extra}`;

async function getJson(url) {
  const res = await fetch(url);
  if (res.ok !== true) throw new Error(`HTTP ${res.status}`);
  const j = await readJson(res);
  if (!j) throw new Error("Geçersiz yanıt (JSON değil)");
  if (j.ok === false) throw new Error(j.error || "Sunucu reddetti");
  return j;
}

async function pullBackup(cfg, id) {
  const j = await getJson(getUrl(cfg, id ? `&id=${encodeURIComponent(id)}` : ""));
  const data = j.data ?? j;
  if (!data || typeof data !== "object" || (!data.checklists && !data.logs)) throw new Error("Drive'da geçerli yedek bulunamadı");
  return { data, savedAt: j.savedAt || data.exportedAt || null, device: j.device || null };
}

export async function listBackups(cfg) {
  const j = await getJson(getUrl(cfg, "&action=list"));
  if (!Array.isArray(j.backups)) throw new Error("Apps Script eski sürüm — yedek geçmişi için kodu güncelleyin");
  return j.backups;
}

export function useDriveSync(state, setState) {
  const [cfg, setCfgState] = useState(loadDrive);
  const [busy, setBusy] = useState(false);
  const [newer, setNewer] = useState(null);
  const cfgRef = useRef(cfg);
  const stateRef = useRef(state);
  const skip = useRef(true);
  cfgRef.current = cfg;
  stateRef.current = state;

  const setCfg = useCallback((p) => {
    setCfgState((c) => {
      const n = { ...c, ...p };
      localStorage.setItem(KEY, JSON.stringify(n));
      return n;
    });
  }, []);

  const backupNow = useCallback(async (silent = false) => {
    const c = cfgRef.current;
    if (!isConfigured(c)) return !silent && toast.error("Önce Apps Script URL ve gizli anahtarı girin");
    setBusy(true);
    try {
      await pushBackup(c, buildBackup(stateRef.current));
      setCfg({ lastSync: Date.now(), lastError: null });
      if (!silent) toast.success("Drive'a yedeklendi");
    } catch (e) {
      setCfg({ lastError: e.message || "Bağlantı hatası" });
      toast.error(silent ? "Otomatik Drive yedeği başarısız" : `Drive yedeği başarısız: ${e.message || "bağlantı hatası"}`, { id: "drive-error" });
    } finally {
      setBusy(false);
    }
  }, [setCfg]);

  const apply = useCallback((data) => {
    skip.current = true;
    setState(mergeState(data));
    setCfg({ lastSync: Date.now(), lastError: null });
  }, [setState, setCfg]);

  const restore = useCallback(async (id) => {
    const c = cfgRef.current;
    if (!isConfigured(c)) return toast.error("Önce Apps Script URL ve gizli anahtarı girin");
    setBusy(true);
    try {
      const { data, savedAt, device } = await pullBackup(c, id);
      const when = savedAt ? new Date(savedAt).toLocaleString("tr-TR") : "bilinmiyor";
      const msg = `Drive yedeği (${when}${device?.name ? ` · ${device.name}` : ""}) · ${data.logs?.length ?? 0} kayıt, ${data.checklists?.length ?? 0} kontrol listesi.\n\nMevcut verilerin üzerine yazılsın mı?`;
      if (!window.confirm(msg)) return;
      apply(data);
      setNewer(null);
      toast.success("Drive'dan geri yüklendi");
    } catch (e) {
      setCfg({ lastError: e.message || "Bağlantı hatası" });
      toast.error(`Geri yükleme başarısız: ${e.message || "bağlantı hatası"}`);
    } finally {
      setBusy(false);
    }
  }, [apply, setCfg]);

  useEffect(() => {
    const c = cfgRef.current;
    if (!isConfigured(c)) return;
    getJson(getUrl(c, "&action=meta"))
      .then((j) => {
        const at = j.savedAt ? Date.parse(j.savedAt) : 0;
        const fromOther = !j.device?.id || j.device.id !== c.deviceId;
        if (at && fromOther && at > (c.lastSync || 0) + 5000 && j.savedAt !== c.ignoredSavedAt) setNewer({ savedAt: j.savedAt, device: j.device?.name || "başka bir cihaz" });
      })
      .catch(() => {});
  }, []);

  const loadNewer = useCallback(async () => {
    setBusy(true);
    try {
      const { data } = await pullBackup(cfgRef.current);
      apply(data);
      setNewer(null);
      toast.success("Diğer cihazın yedeği yüklendi");
    } catch (e) {
      toast.error(`Yükleme başarısız: ${e.message || "bağlantı hatası"}`);
    } finally {
      setBusy(false);
    }
  }, [apply]);
  const dismissNewer = useCallback(() => {
    setCfg({ ignoredSavedAt: newer?.savedAt || null });
    setNewer(null);
  }, [newer, setCfg]);

  useEffect(() => {
    if (skip.current) {
      skip.current = false;
      return;
    }
    const c = cfgRef.current;
    if (!c.auto || !isConfigured(c)) return;
    const t = setTimeout(() => backupNow(true), 3000);
    return () => clearTimeout(t);
  }, [state.logs, state.checklists, backupNow]);

  return { cfg, setCfg, busy, backupNow, restore, newer, loadNewer, dismissNewer };
}
