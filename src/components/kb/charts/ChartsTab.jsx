import { useState } from "react";
import { uid } from "@/lib/store";
import ChartLookup from "./ChartLookup";
import ChartBookmarks from "./ChartBookmarks";
import PdfViewer from "./PdfViewer";

export default function ChartsTab({ state, setState }) {
  const charts = state.charts;
  const setCharts = (fn) => setState((s) => ({ ...s, charts: fn(s.charts) }));
  const [docs, setDocs] = useState([]);
  const [activeId, setActiveId] = useState(null);

  const openDoc = (doc) => {
    const d = { id: uid(), key: doc.url, ...doc };
    setDocs((l) => [...l, d]);
    setActiveId(d.id);
  };
  const closeDoc = (id) => {
    setDocs((l) => {
      const d = l.find((x) => x.id === id);
      if (d?.local) URL.revokeObjectURL(d.url);
      const rest = l.filter((x) => x.id !== id);
      if (activeId === id) setActiveId(rest[rest.length - 1]?.id || null);
      return rest;
    });
  };
  const addBookmark = (b) => setCharts((c) => ({ ...c, bookmarks: [{ id: uid(), ...b }, ...c.bookmarks] }));

  return (
    <div className="grid gap-5 lg:grid-cols-[420px_minmax(0,1fr)] kb-rise" data-testid="charts-tab">
      <div className="min-w-0 space-y-5">
        <ChartLookup icao={charts.icao} setIcao={(icao) => setCharts((c) => ({ ...c, icao }))} onView={openDoc} onBookmark={addBookmark} />
        <ChartBookmarks bookmarks={charts.bookmarks} icao={charts.icao} onAdd={addBookmark} onDelete={(id) => setCharts((c) => ({ ...c, bookmarks: c.bookmarks.filter((b) => b.id !== id) }))} onView={openDoc} />
      </div>
      <PdfViewer
        docs={docs}
        activeId={activeId}
        setActiveId={setActiveId}
        onOpen={openDoc}
        onClose={closeDoc}
        notesFor={(key) => state.chartNotes?.[key] || {}}
        setNotes={(key, fn) => setState((s) => ({ ...s, chartNotes: { ...s.chartNotes, [key]: fn(s.chartNotes?.[key] || {}) } }))}
      />
    </div>
  );
}
