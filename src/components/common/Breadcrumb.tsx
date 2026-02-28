import { useDrawingStore } from '../../store/drawingStore';
import { useMetadata } from '../../hooks/useMetadata';

export function Breadcrumb() {
  const { selectedDrawingId, selectedDiscipline, selectedRegion, selectedRevision } = useDrawingStore();
  const { state } = useMetadata();

  if (state.status !== 'success') return null;

  const drawing = state.data.drawings[selectedDrawingId];
  if (!drawing) return null;

  const parts: string[] = [drawing.name];
  if (selectedDiscipline) parts.push(selectedDiscipline);
  if (selectedRegion) parts.push(`Region ${selectedRegion}`);
  if (selectedRevision) parts.push(selectedRevision);

  return (
    <div className="px-4 py-2 text-xs text-gray-500 border-b bg-white flex items-center gap-1 shrink-0">
      {parts.map((part, i) => (
        <span key={i} className="flex items-center gap-1">
          {i > 0 && <span className="text-gray-300 mx-0.5">›</span>}
          <span className={i === parts.length - 1 ? 'text-gray-700 font-medium' : ''}>
            {part}
          </span>
        </span>
      ))}
    </div>
  );
}
