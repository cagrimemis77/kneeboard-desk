import { DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

const Row = ({ id, children }) => {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className={`flex items-center gap-1 rounded-md ${isDragging ? "relative z-10 bg-[#162032] shadow-[0_8px_24px_rgba(0,0,0,0.5)] ring-1 ring-sky-500/60" : ""}`}>
      <button ref={setActivatorNodeRef} {...attributes} {...listeners} className="kb-btn !min-w-[40px] !cursor-grab !border-transparent !bg-transparent !px-1 touch-none" title="Fazı sürükleyerek sırala" data-testid={`phase-drag-handle-${id}`}><GripVertical size={18} /></button>
      <div className="min-w-0 flex-1">{children}</div>
    </li>
  );
};

export default function SortablePhases({ phases, onMove, renderRow }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const ids = phases.map((p) => p.id);
    onMove(ids.indexOf(active.id), ids.indexOf(over.id));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={phases.map((p) => p.id)} strategy={verticalListSortingStrategy}>
        <ol className="space-y-1.5" data-testid="sortable-phases">
          {phases.map((p, idx) => <Row key={p.id} id={p.id}>{renderRow(p, idx)}</Row>)}
        </ol>
      </SortableContext>
    </DndContext>
  );
}
