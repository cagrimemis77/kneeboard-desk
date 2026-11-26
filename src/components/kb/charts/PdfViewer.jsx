import { useRef, useState } from "react";
import { FileUp, X, ExternalLink, FileText } from "lucide-react";
import { toast } from "sonner";
import PdfCanvasDoc from "./PdfCanvasDoc";

export default function PdfViewer({ docs, activeId, setActiveId, onOpen, onClose, notesFor, setNotes }) {
  const inputRef = useRef(null);
  const [over, setOver] = useState(false);
  const active = docs.find((d) => d.id === activeId);

  const addFiles = (files) => {
    const pdfs = [...(files || [])].filter((f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"));
    if (!pdfs.length) return toast.error("Lütfen PDF dosyası seçin");
    pdfs.forEach((f) => onOpen({ name: f.name, url: URL.createObjectURL(f), local: true, key: `local:${f.name}:${f.size}` }));
  };

  return (
    <section
      className={`kb-card flex min-h-[70vh] flex-col transition-colors ${over ? "!border-sky-400" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files); }}
      data-testid="pdf-viewer"
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1E293B] p-3">
        <button className="kb-btn kb-btn-primary" onClick={() => inputRef.current?.click()} data-testid="pdf-open-button"><FileUp size={18} />Yerel PDF Chart Aç</button>
        <input ref={inputRef} type="file" accept="application/pdf,.pdf" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} data-testid="pdf-file-input" />
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {docs.map((d) => (
            <div key={d.id} className={`flex shrink-0 items-center rounded-md border ${d.id === activeId ? "border-sky-500/60 bg-sky-500/10" : "border-[#1E293B]"}`}>
              <button onClick={() => setActiveId(d.id)} className="flex min-h-[40px] max-w-[200px] items-center gap-1.5 px-3 text-xs font-semibold text-slate-200" title={d.name} data-testid={`pdf-tab-${d.id}`}>
                <FileText size={14} className="shrink-0 text-sky-400" /><span className="truncate">{d.name}</span>
              </button>
              <button onClick={() => onClose(d.id)} className="flex min-h-[40px] min-w-[36px] items-center justify-center text-slate-500 hover:text-rose-400" title="Kapat" data-testid={`pdf-close-${d.id}`}><X size={14} /></button>
            </div>
          ))}
        </div>
        {active && <a href={active.url} target="_blank" rel="noopener noreferrer" className="kb-btn !px-3" title="Yeni sekmede aç" data-testid="pdf-open-external"><ExternalLink size={16} /></a>}
      </div>
      {active ? (
        <PdfCanvasDoc key={active.id} doc={active} notes={notesFor(active.key)} setNotes={(fn) => setNotes(active.key, fn)} />
      ) : (
        <button onClick={() => inputRef.current?.click()} className="m-4 flex flex-1 flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-[#1E293B] p-10 text-center transition-colors hover:border-sky-500/50" data-testid="pdf-dropzone">
          <FileUp size={40} className="text-slate-600" />
          <span className="text-lg font-semibold text-slate-300">Chart PDF'ini buraya sürükleyin veya dokunarak seçin</span>
          <span className="max-w-md text-sm text-slate-500">Dosya cihazınızdan çıkmaz; yalnızca bu oturumda görüntülenir. Kalem, daire ve metin ile not alabilirsiniz — notlar aynı dosyayı tekrar açtığınızda geri gelir.</span>
        </button>
      )}
    </section>
  );
}
