import { useDrawingStore } from '../../store/drawingStore';
import { useMetadata } from '../../hooks/useMetadata';

export function OverlayControlBar() {
  const {
    selectedDrawingId,
    selectedDiscipline,
    isOverlayMode,
    overlayDisciplines,
    baseOpacity,
    addOverlay,
    removeOverlay,
    updateOverlayOpacity,
    setBaseOpacity,
    exitOverlayMode,
  } = useDrawingStore();
  const { state } = useMetadata();

  if (!isOverlayMode || state.status !== 'success') return null;

  const drawing = state.data.drawings[selectedDrawingId];
  const disciplines = drawing?.disciplines ?? {};

  // 오버레이 가능한 공종: imageTransform + image 또는 revisions 있는 공종 (기준 공종 제외)
  const overlayable = Object.entries(disciplines).filter(
    ([name, d]) => name !== selectedDiscipline && d.imageTransform && (d.image || (d.revisions?.length ?? 0) > 0)
  );

  return (
    <div className="border-b bg-white px-4 py-2 flex items-center gap-4 text-sm shrink-0 flex-wrap">
      {/* 기준 공종 투명도 */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 shrink-0">{selectedDiscipline} (기준)</span>
        <OpacityControl value={baseOpacity} onChange={setBaseOpacity} />
      </div>

      <span className="text-gray-200 text-xs">|</span>

      {/* 오버레이 공종 토글 + 투명도 */}
      {overlayable.map(([name, discipline]) => {
        const overlay = overlayDisciplines.find((o) => o.disciplineName === name);
        const isActive = !!overlay;
        const latestRev = discipline.revisions?.at(-1)?.version ?? '';

        return (
          <div key={name} className="flex items-center gap-1.5">
            <button
              onClick={() => (isActive ? removeOverlay(name) : addOverlay(name, latestRev))}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                isActive
                  ? 'bg-blue-50 border-blue-300 text-blue-700'
                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-blue-500' : 'bg-gray-300'}`} />
              {name}
            </button>
            {isActive && (
              <OpacityControl
                value={overlay!.opacity}
                onChange={(v) => updateOverlayOpacity(name, v)}
              />
            )}
          </div>
        );
      })}

      {/* 비교 종료 */}
      <button
        onClick={exitOverlayMode}
        className="ml-auto text-xs text-gray-400 hover:text-gray-600 shrink-0"
      >
        ✕ 비교 종료
      </button>
    </div>
  );
}

function OpacityControl({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-0.5">
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-10 text-center border rounded text-xs py-0.5 text-gray-600"
      />
      <div className="flex flex-col">
        <button
          onClick={() => onChange(value + 1)}
          className="text-[10px] leading-none px-0.5 hover:bg-gray-100 rounded text-gray-500"
        >▲</button>
        <button
          onClick={() => onChange(value - 1)}
          className="text-[10px] leading-none px-0.5 hover:bg-gray-100 rounded text-gray-500"
        >▼</button>
      </div>
    </div>
  );
}
