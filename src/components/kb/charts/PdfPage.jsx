import { useEffect, useRef, useState } from "react";
import { uid } from "@/lib/store";

const MAX_CANVAS = 4096;

const Shape = ({ s, erasing, onErase }) => {
  const common = { onPointerDown: erasing ? (e) => { e.stopPropagation(); onErase(s.id); } : undefined, style: { cursor: erasing ? "pointer" : undefined }, "data-testid": `note-shape-${s.t}` };
  if (s.t === "pen") return <polyline {...common} points={s.pts.map((p) => p.join(",")).join(" ")} fill="none" stroke={s.c} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />;
  if (s.t === "circle") return <ellipse {...common} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill={erasing ? "transparent" : "none"} stroke={s.c} strokeWidth={2.2} />;
  return (
    <text {...common} x={s.x} y={s.y} fill={s.c} fontSize={12} fontWeight={700} fontFamily="Barlow, sans-serif" stroke="#fff" strokeWidth={3} paintOrder="stroke">
      {s.s}
    </text>
  );
};

export default function PdfPage({ pdf, index, width, tool, color, shapes, onAdd, onRemove }) {
  const canvasRef = useRef(null);
  const svgRef = useRef(null);
  const [dims, setDims] = useState(null);
  const [draft, setDraft] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let task;
    pdf.getPage(index).then((page) => {
      if (cancelled) return;
      const base = page.getViewport({ scale: 1 });
      setDims({ w: base.width, h: base.height });
      const css = width / base.width;
      const px = Math.min(css * (window.devicePixelRatio || 1), MAX_CANVAS / base.width);
      const vp = page.getViewport({ scale: px });
      const c = canvasRef.current;
      c.width = vp.width;
      c.height = vp.height;
      c.style.width = `${base.width * css}px`;
      c.style.height = `${base.height * css}px`;
      task = page.render({ canvasContext: c.getContext("2d"), viewport: vp });
      task.promise.catch(() => {});
    });
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [pdf, index, width]);

  const pt = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return [+(((e.clientX - r.left) / r.width) * dims.w).toFixed(1), +(((e.clientY - r.top) / r.height) * dims.h).toFixed(1)];
  };
  const down = (e) => {
    if (!dims || tool === "view" || tool === "erase") return;
    const [x, y] = pt(e);
    if (tool === "text") {
      const s = window.prompt("Not metni (ör. MDA 480 ft, TWR 118.1)");
      if (s?.trim()) onAdd({ id: uid(), t: "text", c: color, x, y, s: s.trim() });
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    setDraft(tool === "pen" ? { t: "pen", c: color, pts: [[x, y]] } : { t: "circle", c: color, x0: x, y0: y, cx: x, cy: y, rx: 0, ry: 0 });
  };
  const move = (e) => {
    if (!draft) return;
    const [x, y] = pt(e);
    if (draft.t === "pen") setDraft((d) => ({ ...d, pts: [...d.pts, [x, y]] }));
    else setDraft((d) => ({ ...d, cx: (d.x0 + x) / 2, cy: (d.y0 + y) / 2, rx: Math.abs(x - d.x0) / 2, ry: Math.abs(y - d.y0) / 2 }));
  };
  const up = () => {
    if (!draft) return;
    const ok = draft.t === "pen" ? draft.pts.length > 1 : draft.rx + draft.ry > 3;
    if (ok) {
      const { x0, y0, ...rest } = draft;
      onAdd({ ...rest, id: uid() });
    }
    setDraft(null);
  };

  return (
    <div className="relative mx-auto mb-4 w-fit shadow-[0_8px_30px_rgba(0,0,0,0.5)]" data-testid={`pdf-page-${index}`}>
      <canvas ref={canvasRef} className="block bg-white" />
      {dims && (
        <svg
          ref={svgRef}
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          style={{ pointerEvents: tool === "view" ? "none" : "auto", touchAction: tool === "view" ? "auto" : "none", cursor: tool === "view" ? "default" : tool === "erase" ? "not-allowed" : "crosshair" }}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          data-testid={`pdf-overlay-${index}`}
        >
          {shapes.map((s) => <Shape key={s.id} s={s} erasing={tool === "erase"} onErase={onRemove} />)}
          {draft && <Shape s={{ ...draft, id: "draft" }} />}
        </svg>
      )}
    </div>
  );
}
