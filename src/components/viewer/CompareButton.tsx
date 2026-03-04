import { useDrawingStore } from '../../store/drawingStore';
import { useMetadata } from '../../hooks/useMetadata';
import { getBaseDisciplineForDrawing } from '../../utils/resolveCurrentView';

export function CompareButton() {
  const { selectedDrawingId, selectedDiscipline, isOverlayMode, enterOverlayMode } = useDrawingStore();
  const { data } = useMetadata();

  if (isOverlayMode || !selectedDiscipline) return null;

  const drawing = data.drawings[selectedDrawingId];
  if (!drawing?.disciplines) return null;

  const baseDiscipline = getBaseDisciplineForDrawing(drawing);
  if (selectedDiscipline !== baseDiscipline) return null;

  const disciplines = drawing.disciplines;

  // imageTransform이 있고, image 또는 revisions가 있는 공종 (기준 공종 제외)
  const hasOverlayable = Object.entries(disciplines).some(
    ([name, d]) => name !== selectedDiscipline && d.imageTransform && (d.image || (d.revisions?.length ?? 0) > 0)
  );
  if (!hasOverlayable) return null;

  return (
    <button
      onClick={enterOverlayMode}
      className="shrink-0 px-3 py-1 bg-sky-100 border border-sky-200 rounded text-xs font-medium text-sky-700 hover:bg-sky-200 transition-colors"
    >
      공종 비교
    </button>
  );
}
