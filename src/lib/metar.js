const CLOUD_TR = { FEW: "Az", SCT: "Dağınık", BKN: "Kırık", OVC: "Kapalı", VV: "Dikey Görüş" };
const WX_RE = /^(\+|-|VC)?(MI|BC|PR|DR|BL|SH|TS|FZ)?((DZ|RA|SN|SG|IC|PL|GR|GS|UP|BR|FG|FU|VA|DU|SA|HZ|PY|PO|SQ|FC|SS|DS)+)$/;
const temp = (s) => (s.startsWith("M") ? -Number(s.slice(1)) : Number(s));

export function parseMetar(raw) {
  const text = (raw || "").trim().toUpperCase().replace(/=$/, "");
  if (!text) return null;
  const tokens = text.split(/\s+/);
  const r = { raw: text, station: null, time: null, wind: null, visibility: null, clouds: [], weather: [], temp: null, dew: null, qnh: null, altimeter: null, cavok: false, trend: null };
  let i = 0;
  if (tokens[i] === "METAR" || tokens[i] === "SPECI") i++;
  if (/^[A-Z0-9]{4}$/.test(tokens[i] || "")) r.station = tokens[i++];
  for (; i < tokens.length; i++) {
    const t = tokens[i];
    let m;
    if (["TEMPO", "BECMG", "NOSIG", "RMK"].includes(t)) { r.trend = tokens.slice(i).join(" "); break; }
    if (!r.time && (m = t.match(/^(\d{2})(\d{2})(\d{2})Z$/))) r.time = { day: m[1], hh: m[2], mm: m[3] };
    else if (!r.wind && (m = t.match(/^(\d{3}|VRB)(\d{2,3})(?:G(\d{2,3}))?(KT|MPS)$/))) {
      const f = m[4] === "MPS" ? 1.944 : 1;
      r.wind = { dir: m[1] === "VRB" ? null : Number(m[1]), variable: m[1] === "VRB", speed: Math.round(Number(m[2]) * f), gust: m[3] ? Math.round(Number(m[3]) * f) : null };
    } else if (r.wind && (m = t.match(/^(\d{3})V(\d{3})$/))) r.wind.range = [Number(m[1]), Number(m[2])];
    else if (t === "CAVOK") { r.cavok = true; r.visibility = { meters: 10000, text: "CAVOK (≥10 km)" }; }
    else if (!r.visibility && /^\d{4}$/.test(t)) r.visibility = { meters: Number(t), text: t === "9999" ? "≥ 10 km" : `${Number(t)} m` };
    else if (!r.visibility && (m = t.match(/^(P|M)?(\d+)?(?:\s?(\d)\/(\d))?SM$/))) {
      const sm = (Number(m[2] || 0)) + (m[3] ? Number(m[3]) / Number(m[4]) : 0);
      r.visibility = { meters: Math.round(sm * 1609), text: `${m[1] === "P" ? ">" : ""}${sm} SM` };
    } else if ((m = t.match(/^(FEW|SCT|BKN|OVC|VV)(\d{3}|\/\/\/)(CB|TCU)?$/))) {
      r.clouds.push({ cover: m[1], label: CLOUD_TR[m[1]], ft: m[2] === "///" ? null : Number(m[2]) * 100, type: m[3] || null });
    } else if (["NSC", "SKC", "CLR", "NCD"].includes(t)) r.clouds.push({ cover: t, label: "Önemli bulut yok", ft: null });
    else if ((m = t.match(/^(M?\d{2})\/(M?\d{2})?$/))) { r.temp = temp(m[1]); r.dew = m[2] ? temp(m[2]) : null; }
    else if ((m = t.match(/^Q(\d{4})$/))) { r.qnh = Number(m[1]); r.altimeter = +(r.qnh / 33.8639).toFixed(2); }
    else if ((m = t.match(/^A(\d{4})$/))) { r.altimeter = Number(m[1]) / 100; r.qnh = Math.round(r.altimeter * 33.8639); }
    else if (WX_RE.test(t)) r.weather.push(t);
  }
  return r;
}

export function parseRunway(input) {
  const m = String(input || "").trim().toUpperCase().match(/^(\d{1,2})([LCR])?$/);
  if (!m) return null;
  const n = Number(m[1]);
  if (n < 1 || n > 36) return null;
  return { number: n, side: m[2] || "", heading: n * 10 };
}

export const reciprocalRunway = (rwy) => {
  if (!rwy) return "";
  const n = ((rwy.number + 17) % 36) + 1;
  const side = { L: "R", R: "L", C: "C" }[rwy.side] || "";
  return `${String(n).padStart(2, "0")}${side}`;
};

export function windComponents(dir, speed, heading) {
  const a = ((dir - heading) * Math.PI) / 180;
  return { head: speed * Math.cos(a), cross: speed * Math.sin(a) };
}

export const formatRunway = (rwy) => `${String(rwy.number).padStart(2, "0")}${rwy.side}`;

export function resolveHeading(metar) {
  const rwy = parseRunway(metar.runway);
  const override = metar.headingOverride !== "" && metar.headingOverride != null && !isNaN(Number(metar.headingOverride));
  const heading = override ? ((Number(metar.headingOverride) % 360) + 360) % 360 : rwy?.heading;
  return { rwy, override, heading };
}

export function runwayWind(wind, heading) {
  if (!wind || heading === undefined || heading === null) return null;
  const f = (spd) => (wind.variable ? { head: 0, cross: spd } : windComponents(wind.dir, spd, heading));
  return { comp: f(wind.speed), gustComp: wind.gust ? f(wind.gust) : null };
}

export const evalWind = (w, s) => (s.useGust && w.gustComp ? w.gustComp : w.comp);

export const normPreset = (x) => (typeof x === "string" ? { d: x, hdg: null } : { d: x.d, hdg: x.hdg ?? null });

export function rankRunways(presets, wind, s) {
  if (!wind) return [];
  return presets
    .map((x) => {
      const p = normPreset(x);
      const rwy = parseRunway(p.d);
      if (!rwy) return null;
      const heading = p.hdg ?? rwy.heading;
      const w = runwayWind(wind, heading);
      const ev = evalWind(w, s);
      return { designator: formatRunway(rwy), hdg: p.hdg, heading, ...w, ev, tail: ev.head < -0.5, alert: assessWind(ev, s) };
    })
    .filter(Boolean)
    .sort((a, b) => {
      if (a.tail !== b.tail) return a.tail ? 1 : -1;
      if (a.tail) return b.ev.head - a.ev.head;
      return Math.abs(a.ev.cross) - Math.abs(b.ev.cross) || b.ev.head - a.ev.head;
    });
}

export function assessWind({ head, cross }, s) {
  const xw = Math.abs(cross);
  const tail = head < -0.5 ? -head : 0;
  if (xw > s.maxCrosswind || tail > s.maxTailwind)
    return { level: "danger", title: "LİMİT DIŞI", msg: xw > s.maxCrosswind ? `Yan rüzgâr ${s.maxCrosswind} kt limitini aşıyor` : `Arka rüzgâr ${s.maxTailwind} kt limitini aşıyor` };
  if (xw > s.cautionCrosswind || tail > 0)
    return { level: "caution", title: "DİKKAT", msg: tail > 0 ? "Arka rüzgâr bileşeni mevcut — ters pisti değerlendirin" : `Yan rüzgâr ${s.cautionCrosswind} kt uyarı eşiğinin üzerinde` };
  return { level: "ok", title: "LİMİT İÇİ", msg: "Rüzgâr bileşenleri tanımlı limitler içinde" };
}
