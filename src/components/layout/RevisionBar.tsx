import { useDrawingStore } from "../../store/drawingStore";
import { RevisionTimeline } from "./RevisionTimeline";

export function RevisionBar() {
  const { selectedDiscipline } = useDrawingStore();

  // 공종 미선택 시 미표시 — 자신의 표시 여부를 직접 결정
  if (!selectedDiscipline) return null;

  return (
    <div className="border-t bg-white px-4 py-3 flex items-center gap-3 shrink-0">
      <span className="text-xs text-gray-500 shrink-0">리비전 이력</span>
      <RevisionTimeline />
    </div>
  );
}
