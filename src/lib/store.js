import { useEffect, useState } from "react";
import { buildTemplates, DEFAULT_SETTINGS, DEFAULT_RUNWAYS, SURFACES } from "./templates";

export const STORAGE_KEY = "av_kneeboard_state_v1";
export const uid = () => Math.random().toString(36).slice(2, 10);

export const defaultState = () => {
  const checklists = buildTemplates();
  return {
    version: 1,
    checklists,
    checked: {},
    activeChecklistId: checklists[0].id,
    activePhaseId: checklists[0].phases[0].id,
    phaseStart: Date.now(),
    logs: [],
    settings: { ...DEFAULT_SETTINGS },
    runwayPresets: JSON.parse(JSON.stringify(DEFAULT_RUNWAYS)),
    metar: { icao: DEFAULT_SETTINGS.defaultAirport, raw: "LTFM 260150Z 21018G28KT 9999 FEW035 14/06 Q1018", runway: "35L", headingOverride: "" },
    phaseHistory: {},
    chartNotes: {},
    charts: { icao: DEFAULT_SETTINGS.defaultAirport, bookmarks: [] },
  };
};

export const mergeState = (data) => {
  const base = defaultState();
  const merged = { ...base, ...data, settings: { ...base.settings, ...(data.settings || {}) }, metar: { ...base.metar, ...(data.metar || {}) }, charts: { ...base.charts, ...(data.charts || {}) } };
  if (!Array.isArray(merged.charts.bookmarks)) merged.charts.bookmarks = [];
  if (!merged.phaseHistory || typeof merged.phaseHistory !== "object") merged.phaseHistory = {};
  if (!merged.chartNotes || typeof merged.chartNotes !== "object") merged.chartNotes = {};
  if (!Array.isArray(merged.checklists) || !merged.checklists.length) merged.checklists = base.checklists;
  if (!Array.isArray(merged.logs)) merged.logs = [];
  if (!merged.runwayPresets || typeof merged.runwayPresets !== "object") merged.runwayPresets = base.runwayPresets;
  return merged;
};

export function usePersistentState() {
  const [state, setState] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? mergeState(JSON.parse(raw)) : defaultState();
    } catch {
      return defaultState();
    }
  });
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);
  return [state, setState];
}

export const landingRating = (fpm, s) => {
  const v = Math.abs(Number(fpm));
  if (v <= s.fpmSoft) return { key: "soft", label: "Yumuşak İniş", cls: "text-emerald-400 bg-emerald-500/10 border-emerald-500/40" };
  if (v <= s.fpmNormal) return { key: "normal", label: "Normal", cls: "text-sky-400 bg-sky-500/10 border-sky-500/40" };
  return { key: "hard", label: "Sert İniş", cls: "text-amber-400 bg-amber-500/10 border-amber-500/40" };
};

export const activeProfile = (s) => s.aircraftProfiles?.find((p) => p.id === s.activeProfileId) || null;

export const effectiveSettings = (s) => {
  const p = activeProfile(s);
  const e = p ? { ...s, cautionCrosswind: p.caution, maxCrosswind: p.max, maxTailwind: p.tail, profileName: p.name } : { ...s, profileName: "Manuel" };
  const surf = SURFACES.find((x) => x.id === s.runwaySurface) || SURFACES[0];
  const wetLimit = p ? p.wet : s.wetCrosswind;
  const cap = surf.cap === null ? null : wetLimit != null && wetLimit !== "" ? Math.min(surf.cap, Number(wetLimit)) : surf.cap;
  e.surface = surf;
  e.surfaceCap = cap;
  e.surfaceCapped = cap !== null && cap < e.maxCrosswind;
  if (e.surfaceCapped) {
    e.maxCrosswind = cap;
    e.cautionCrosswind = Math.min(e.cautionCrosswind, Math.round(cap * 0.7));
  }
  return e;
};

export const buildBackup = (state) => ({ ...state, app: "av-kneeboard", exportedAt: new Date().toISOString() });

const TYPE_RULES = [
  [/A20N|A320\s*-?\s*NEO/, "a320neo"],
  [/A21N|A321\s*-?\s*(NEO|LR|XLR)/, "a321neo"],
  [/A19N|A319/, "a319"],
  [/A318/, "a318"],
  [/A320/, "a320ceo"],
  [/A321/, "a321ceo"],
  [/A33\d|A330/, "a330"],
  [/A34\d|A340/, "a340"],
  [/A35\d|A35K|A350/, "a350"],
  [/A38\d|A380/, "a380"],
];

export const matchProfile = (type, profiles = []) => {
  const t = (type || "").toUpperCase();
  if (!t.trim()) return null;
  const custom = profiles.find((p) => p.name && t.includes(p.name.toUpperCase()));
  if (custom) return custom;
  const rule = TYPE_RULES.find(([re]) => re.test(t));
  return rule ? profiles.find((p) => p.id === rule[1]) || null : null;
};

export const fmtDur = (sec) => `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
