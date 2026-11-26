import { DndContext, closestCenter, PointerSensor, TouchSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import ItemEditorRow from "./ItemEditorRow";

export default function SortableItems({ phase, actions }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const ids = phase.items.map((i) => i.id);
    actions.moveItem(phase.id, ids.indexOf(active.id), ids.indexOf(over.id));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={phase.items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2" data-testid="sortable-items">
          {phase.items.map((item) => (
            <ItemEditorRow key={item.id} item={item} onChange={(d) => actions.updateItem(phase.id, item.id, d)} onDelete={() => actions.deleteItem(phase.id, item.id)} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
