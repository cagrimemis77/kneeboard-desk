const AIP_AERO = "https://aip.aero/";

const COUNTRY = {
  LT: { country: "Türkiye", name: "DHMİ — AIP Türkiye", url: "https://www.dhmi.gov.tr/Sayfalar/aipturkey.aspx", aero: "tr" },
  ED: { country: "Almanya", name: "DFS — AIP Germany (BasicIFR)", url: "https://aip.dfs.de/", aero: "de" },
  EG: { country: "İngiltere", name: "NATS — UK eAIP", url: "https://nats-uk.ead-it.com/cms-nats/opencms/en/Publications/AIP/" },
  LF: { country: "Fransa", name: "SIA — eAIP France", url: "https://www.sia.aviation-civile.gouv.fr/", aero: "fr" },
  LE: { country: "İspanya", name: "ENAIRE — AIP España", url: "https://aip.enaire.es/AIP/", aero: "es" },
  LI: { country: "İtalya", name: "ENAV — AIP Italia", url: "https://www.enav.it/en/what-we-do/we-create-solutions-for-international-markets/aeronautical-information", aero: "it" },
  EP: { country: "Polonya", name: "PANSA — AIP Polska", url: "https://www.ais.pansa.pl/en/publications/aip-poland/", aero: "pl" },
};

export const isUS = (icao) => /^K[A-Z0-9]{3}$/.test(icao);

export function providersFor(icao) {
  const c = COUNTRY[icao.slice(0, 2)];
  const list = [];
  if (c) list.push({ id: "official", name: c.name, desc: `${c.country} resmî ücretsiz eAIP portalı`, url: c.url, official: true });
  list.push({ id: "chartfox", name: "ChartFox", desc: `${icao} için doğrudan chart dizini (ücretsiz hesap gerekebilir)`, url: `https://chartfox.org/${icao}` });
  list.push({ id: "aipaero", name: "AIP.Aero", desc: c?.aero ? `${c.country} AIP ve yaklaşma kartları dizini` : "Ülke bazlı ücretsiz AIP dizini", url: c?.aero ? `${AIP_AERO}${c.aero}/` : AIP_AERO });
  return { country: c?.country || null, list };
}

export const FAA_GROUPS = [
  { key: "apd", label: "Havalimanı Diyagramı (Airport Diagram)" },
  { key: "dp", label: "SID / Kalkış (DP)" },
  { key: "star", label: "STAR / Varış" },
  { key: "iap", label: "Yaklaşma (Approach)" },
  { key: "other", label: "Genel / Diğer (Minimums, Hot Spots)" },
];

const V1_CODE = { APD: "apd", DP: "dp", STAR: "star", IAP: "iap" };

function normalize(data, icao) {
  const groups = { apd: [], dp: [], star: [], iap: [], other: [] };
  let airport = null;
  if (data?.charts) {
    const c = data.charts;
    airport = data.airport_data?.airport_name || null;
    const map = { airport_diagram: "apd", departure: "dp", arrival: "star", approach: "iap", general: "other" };
    Object.entries(c).forEach(([k, arr]) => (arr || []).forEach((x) => groups[map[k] || "other"].push({ name: x.chart_name, url: x.pdf_url })));
  } else {
    const arr = data?.[icao] || Object.values(data || {})[0] || [];
    if (!Array.isArray(arr)) return null;
    arr.forEach((x) => {
      airport = airport || x.airport_name;
      groups[V1_CODE[x.chart_code] || "other"].push({ name: x.chart_name, url: x.pdf_path });
    });
  }
  return Object.values(groups).some((g) => g.length) ? { airport, groups } : null;
}

export async function fetchFaaCharts(icao) {
  const urls = [`https://api-v2.aviationapi.com/v2/charts?airport=${icao}`, `https://api.aviationapi.com/v1/charts?apt=${icao}`];
  for (const u of urls) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 10000);
    try {
      const res = await fetch(u, { signal: ctrl.signal });
      if (!res.ok) continue;
      const out = normalize(await res.json(), icao);
      if (out) return out;
    } catch {
      /* try next endpoint */
    } finally {
      clearTimeout(t);
    }
  }
  return null;
}
