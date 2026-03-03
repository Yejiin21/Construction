import { useDrawingStore } from '../../store/drawingStore';
import { useMetadata } from '../../hooks/useMetadata';

export function DisciplinePanel() {
  const {
    selectedDrawingId,
    selectedDiscipline,
    selectedRegion,
    selectDiscipline,
    selectRegion,
    selectRevision,
  } = useDrawingStore();
  const { state } = useMetadata();

  if (state.status !== 'success') return null;

  const drawing = state.data.drawings[selectedDrawingId];
  if (!drawing?.disciplines || selectedDrawingId === '00') return null;

  const disciplines = drawing.disciplines;

  function handleDisciplineSelect(disciplineName: string) {
    selectDiscipline(disciplineName);

    const discipline = disciplines[disciplineName];
    if (!discipline) return;

    // region이 있으면 첫 번째 region + 해당 최신 리비전 자동 선택
    if (discipline.regions) {
      const firstRegion = Object.keys(discipline.regions)[0];
      selectRegion(firstRegion);
      const latestRev = discipline.regions[firstRegion].revisions.at(-1);
      if (latestRev) selectRevision(latestRev.version);
    } else {
      const latestRev = discipline.revisions?.at(-1);
      if (latestRev) selectRevision(latestRev.version);
    }
  }

  function handleRegionSelect(region: string) {
    if (!selectedDiscipline) return;
    selectRegion(region);
    const latestRev = disciplines[selectedDiscipline]?.regions?.[region]?.revisions.at(-1);
    if (latestRev) selectRevision(latestRev.version);
  }

  return (
    <div>
      <div className="px-3 py-1.5 text-xs font-medium text-gray-400 uppercase tracking-wider">
        공종
      </div>
      {Object.entries(disciplines).map(([name, discipline]) => {
        const latestRev = discipline.revisions?.at(-1);
        const hasChange = (latestRev?.changes.length ?? 0) > 0;
        const isSelected = selectedDiscipline === name;

        return (
          <div key={name}>
            <button
              onClick={() => handleDisciplineSelect(name)}
              className={`w-full flex items-center gap-2 pl-4 pr-3 py-1.5 text-sm text-left ${
                isSelected
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-gray-300 text-xs">
                {discipline.regions ? (isSelected ? '▼' : '▶') : '─'}
              </span>
              <span className="flex-1">{name}</span>
              {hasChange && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              )}
            </button>

            {/* region 있는 공종 선택 시 Region A/B 인라인 표시 */}
            {isSelected && discipline.regions &&
              Object.keys(discipline.regions).map((region) => (
                <button
                  key={region}
                  onClick={() => handleRegionSelect(region)}
                  className={`w-full flex items-center gap-2 pl-9 pr-3 py-1.5 text-sm text-left ${
                    selectedRegion === region
                      ? 'text-blue-600 font-medium'
                      : 'text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <span className="text-gray-300 text-xs">─</span>
                  Region {region}
                </button>
              ))}
          </div>
        );
      })}
    </div>
  );
}
