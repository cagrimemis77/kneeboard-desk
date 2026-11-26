import { useEffect, useRef, useState } from "react";
import { Hand, Pencil, Circle, Type, Eraser, Undo2, Trash2, ZoomIn, ZoomOut, Loader2, Info } from "lucide-react";
import pdfjsLib from "@/lib/pdf";
import PdfPage from "./PdfPage";

const TOOLS = [
  { id: "view", label: "Görüntüle", icon: Hand },
  { id: "pen", label: "Kalem", icon: Pencil },
  { id: "circle", label: "Daire", icon: Circle },
  { id: "text", label: "Metin", icon: Type },
  { id: "erase", label: "Silgi", icon: Eraser },
];
const COLORS = ["#E11D48", "#D97706", "#0284C7", "#059669", "#7C3AED"];

export default function PdfCanvasDoc({ doc, notes, setNotes }) {
  const [pdf, setPdf] = useState(null);
  const [failed, setFailed] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState("view");
  const [color, setColor] = useState(COLORS[0]);
  const [width, setWidth] = useState(0);
  const wrapRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const task = pdfjsLib.getDocument(doc.url);
    task.promise.then((p) => alive && setPdf(p)).catch(() => alive && setFailed(true));
    return () => { alive = false; task.destroy(); };
  }, [doc.url]);

  useEffect(() => {
    const ro = new ResizeObserver(([e]) => setWidth(Math.floor(e.contentRect.width / 10) * 10));
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => ro.disconnect();
  }, [failed]);

  if (failed)
    return (
      <div className="flex flex-1 flex-col">
        <p className="flex gap-2 border-b border-[#1E293B] bg-amber-500/5 px-3 py-2 text-xs text-amber-300" data-testid="pdf-notes-unavailable">
          <Info size={14} className="mt-0.5 shrink-0" />{doc.local ? "Bu PDF not modunda açılamadı; yalnızca görüntüleniyor." : "Bu uzak PDF tarayıcı güvenliği nedeniyle yalnızca görüntülenebilir. Not almak için PDF'i indirip \"Yerel PDF Chart Aç\" ile açın."}
        </p>
        <iframe src={doc.url} title={doc.name} className="w-full flex-1 bg-[#0B0F19]" style={{ minHeight: "calc(100vh - 280px)" }} data-testid="pdf-iframe" />
      </div>
    );

  const count = Object.values(notes).reduce((a, l) => a + l.length, 0);
  const add = (page) => (s) => setNotes((n) => ({ ...n, [page]: [...(n[page] || []), { ...s, ts: Date.now() }] }));
  const remove = (page) => (id) => setNotes((n) => ({ ...n, [page]: (n[page] || []).filter((s) => s.id !== id) }));
  const undo = () =>
    setNotes((n) => {
      let last = null;
      Object.entries(n).forEach(([p, l]) => l.forEach((s) => { if (!last || (s.ts || 0) > last.ts) last = { p, id: s.id, ts: s.ts || 0 }; }));
      return last ? { ...n, [last.p]: n[last.p].filter((s) => s.id !== last.id) } : n;
    });
  const clear = () => window.confirm("Bu chart'taki tüm notlar silinsin mi?") && setNotes(() => ({}));

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-[#1E293B] p-2" data-testid="annot-toolbar">
        {TOOLS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTool(id)} title={label} data-testid={`annot-tool-${id}`} className={`kb-btn !min-h-[42px] !px-2.5 text-xs ${tool === id ? "kb-btn-primary" : ""}`}>
            <Icon size={16} /><span className="hidden xl:inline">{label}</span>
          </button>
        ))}
        <div className="mx-1 flex gap-1">
          {COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} title="Renk" data-testid={`annot-color-${c.slice(1)}`} className={`h-[42px] w-[34px] rounded-md border-2 ${color === c ? "border-slate-100" : "border-transparent"}`}>
              <span className="mx-auto block h-5 w-5 rounded-full" style={{ background: c }} />
            </button>
          ))}
        </div>
        <button className="kb-btn !min-h-[42px] !px-2.5" onClick={undo} disabled={!count} title="Geri al" data-testid="annot-undo"><Undo2 size={16} /></button>
        <button className="kb-btn kb-btn-danger !min-h-[42px] !px-2.5" onClick={clear} disabled={!count} title="Notları temizle" data-testid="annot-clear"><Trash2 size={16} /></button>
        <span className="font-mono text-[11px] text-slate-500" data-testid="annot-count">{count} NOT</span>
        <div className="ml-auto flex items-center gap-1">
          <button className="kb-btn !min-h-[42px] !px-2.5" onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))} title="Uzaklaştır" data-testid="annot-zoom-out"><ZoomOut size={16} /></button>
          <span className="w-12 text-center font-mono text-xs text-slate-300" data-testid="annot-zoom">%{Math.round(zoom * 100)}</span>
          <button className="kb-btn !min-h-[42px] !px-2.5" onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))} title="Yakınlaştır" data-testid="annot-zoom-in"><ZoomIn size={16} /></button>
        </div>
      </div>
      <div ref={wrapRef} className="flex-1 overflow-auto bg-[#080C14] p-3" style={{ maxHeight: "calc(100vh - 230px)", minHeight: "60vh" }} data-testid="pdf-canvas-wrap">
        {!pdf && <p className="flex items-center justify-center gap-2 py-20 text-slate-400"><Loader2 size={18} className="animate-spin" />PDF yükleniyor…</p>}
        {pdf && width > 0 && Array.from({ length: pdf.numPages }, (_, i) => (
          <PdfPage key={i} pdf={pdf} index={i + 1} width={(width - 24) * zoom} tool={tool} color={color} shapes={notes[i + 1] || []} onAdd={add(i + 1)} onRemove={remove(i + 1)} />
        ))}
      </div>
    </div>
  );
}
