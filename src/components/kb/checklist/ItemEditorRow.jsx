import { Trash2, AlertTriangle, GripVertical } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export default function ItemEditorRow({ item, onChange, onDelete }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`grid gap-2 rounded-md border bg-[#0B0F19]/60 p-2 sm:grid-cols-[auto_1fr_200px_auto_auto] ${isDragging ? "relative z-10 border-sky-500/60 shadow-[0_8px_24px_rgba(0,0,0,0.5)]" : "border-[#1E293B]"}`}
      data-testid={`checklist-item-editor-${item.id}`}
    >
      <button ref={setActivatorNodeRef} {...attributes} {...listeners} className="kb-btn !cursor-grab !px-2 touch-none active:!cursor-grabbing" title="Sürükleyerek sırala" data-testid={`item-drag-handle-${item.id}`}><GripVertical size={18} /></button>
      <input className="kb-input" value={item.text} onChange={(e) => onChange({ text: e.target.value })} placeholder="Adım (ör. PARKING BRAKE)" data-testid={`item-text-input-${item.id}`} />
      <input className="kb-input font-mono" value={item.action} onChange={(e) => onChange({ action: e.target.value })} placeholder="Yanıt (ör. SET)" data-testid={`item-action-input-${item.id}`} />
      <button
        className={`kb-btn ${item.critical ? "!border-amber-500/60 !bg-amber-500/10 !text-amber-400" : ""}`}
        onClick={() => onChange({ critical: !item.critical })}
        title="KRİTİK olarak işaretle"
        data-testid={`item-critical-toggle-${item.id}`}
      >
        <AlertTriangle size={16} />KRİTİK
      </button>
      <button className="kb-btn kb-btn-danger" onClick={onDelete} title="Adımı sil" data-testid={`item-delete-${item.id}`}><Trash2 size={16} /></button>
      <input className="kb-input text-sm sm:col-span-5" value={item.note || ""} onChange={(e) => onChange({ note: e.target.value })} placeholder="Not (isteğe bağlı)" data-testid={`item-note-input-${item.id}`} />
    </div>
  );
}
