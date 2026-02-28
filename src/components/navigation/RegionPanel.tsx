import { useDrawingStore } from '../../store/drawingStore';
import { useMetadata } from '../../hooks/useMetadata';

export function RegionPanel() {
  const {
    selectedDrawingId,
    selectedDiscipline,
    selectedRegion,
    selectRegion,
    selectRevision,
  } = useDrawingStore();
  const { state } = useMetadata();

  if (state.status !== 'success') return null;

  const drawing = state.data.drawings[selectedDrawingId];
  const discipline = drawing?.disciplines?.[selectedDiscipline ?? ''];

  // 자신의 표시 여부를 직접 결정 — region 없으면 null
  if (!discipline?.regions) return null;

  function handleSelect(region: string) {
    if (!discipline?.regions) return;
    selectRegion(region);
    const latestRev = discipline.regions[region].revisions.at(-1);
    if (latestRev) selectRevision(latestRev.version);
  }

  return (
    <div className="px-3 py-2 border-t border-gray-100">
      <div className="text-xs font-medium text-gray-400 mb-1.5 uppercase tracking-wider">
        영역
      </div>
      <div className="flex gap-1.5">
        {Object.keys(discipline.regions).map((region) => (
          <button
            key={region}
            onClick={() => handleSelect(region)}
            className={`px-3 py-1 rounded text-sm ${
              selectedRegion === region
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Region {region}
          </button>
        ))}
      </div>
    </div>
  );
}
