import { useState } from 'react';
import { useDrawingStore } from '../../store/drawingStore';
import { useMetadata } from '../../hooks/useMetadata';

export function BuildingTree() {
  const {
    selectedDrawingId,
    selectedDiscipline,
    selectedRegion,
    selectDrawing,
    selectDiscipline,
    selectRegion,
    selectRevision,
  } = useDrawingStore();
  const { state, childrenMap, getLatestRevision, hasRecentChange } = useMetadata();

  // 펼쳐진 동 — 로컬 UI 상태 (한 번에 하나만)
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (state.status === 'loading') {
    return <div className="p-4 text-sm text-gray-400">불러오는 중...</div>;
  }
  if (state.status === 'error') {
    return <div className="p-4 text-sm text-red-400">데이터 오류: {state.message}</div>;
  }

  const { data } = state;
  const buildings = childrenMap['00'] ?? [];

  function handleBuildingClick(id: string) {
    selectDrawing(id);
    setExpandedId((prev) => (prev === id ? null : id));
  }

  function handleDisciplineSelect(disciplineName: string, drawingId: string) {
    selectDiscipline(disciplineName);
    const discipline = data.drawings[drawingId]?.disciplines?.[disciplineName];
    if (!discipline) return;

    const latest = getLatestRevision(discipline);
    if (discipline.regions) {
      const firstRegion = Object.keys(discipline.regions)[0];
      selectRegion(firstRegion);
      if (latest && typeof latest === 'object' && !('version' in latest)) {
        const rev = (latest as Record<string, { version: string }>)[firstRegion];
        if (rev) selectRevision(rev.version);
      }
    } else if (latest && 'version' in latest) {
      selectRevision((latest as { version: string }).version);
    }
  }

  function handleRegionSelect(region: string, disciplineName: string, drawingId: string) {
    selectDiscipline(disciplineName);
    selectRegion(region);
    const discipline = data.drawings[drawingId]?.disciplines?.[disciplineName];
    const latest = discipline ? getLatestRevision(discipline) : undefined;
    if (latest && typeof latest === 'object' && !('version' in latest)) {
      const rev = (latest as Record<string, { version: string }>)[region];
      if (rev) selectRevision(rev.version);
    }
  }

  return (
    <nav className="py-2 text-sm select-none">
      {/* 전체 배치도 — 루트 */}
      <button
        onClick={() => { selectDrawing('00'); setExpandedId(null); }}
        className={`w-full flex items-center gap-2 px-3 py-1.5 text-left ${
          selectedDrawingId === '00'
            ? 'bg-blue-50 text-blue-700 font-medium'
            : 'text-gray-700 hover:bg-gray-50'
        }`}
      >
        <span className="text-gray-400 text-xs w-3 shrink-0">◉</span>
        <span>{data.drawings['00'].name}</span>
      </button>

      {/* 동 목록 — 1단계 */}
      {buildings.map((building) => {
        const isExpanded = expandedId === building.id;
        const isSelected = selectedDrawingId === building.id;
        const disciplines = building.disciplines ?? {};

        return (
          <div key={building.id}>
            {/* 동 항목 */}
            <button
              onClick={() => handleBuildingClick(building.id)}
              className={`w-full flex items-center gap-2 pl-5 pr-3 py-1.5 text-left ${
                isSelected
                  ? 'bg-blue-50 text-blue-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-gray-400 text-xs w-3 shrink-0">
                {isExpanded ? '▼' : '▶'}
              </span>
              <span>{building.name}</span>
            </button>

            {/* 공종 목록 — 2단계 */}
            {isExpanded && Object.entries(disciplines).map(([disciplineName, discipline]) => {
              const hasChange = hasRecentChange(discipline);
              const hasRegions = !!discipline.regions;
              const isDisciplineSelected = isSelected && selectedDiscipline === disciplineName;

              return (
                <div key={disciplineName}>
                  {/* 공종 항목 */}
                  <button
                    onClick={() => handleDisciplineSelect(disciplineName, building.id)}
                    className={`w-full flex items-center gap-2 pl-10 pr-3 py-1.5 text-left ${
                      isDisciplineSelected
                        ? 'text-blue-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-gray-300 text-xs w-3 shrink-0">
                      {hasRegions ? '▼' : '─'}
                    </span>
                    <span className="flex-1">{disciplineName}</span>
                    {hasChange && (
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                    )}
                  </button>

                  {/* Region 항목 — 3단계 (region 있는 공종은 항상 표시) */}
                  {hasRegions && Object.keys(discipline.regions!).map((region) => {
                    const isRegionSelected = isDisciplineSelected && selectedRegion === region;
                    return (
                      <button
                        key={region}
                        onClick={() => handleRegionSelect(region, disciplineName, building.id)}
                        className={`w-full flex items-center gap-2 pl-14 pr-3 py-1.5 text-left ${
                          isRegionSelected
                            ? 'text-blue-600 font-medium'
                            : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-gray-300 text-xs w-3 shrink-0">─</span>
                        <span>Region {region}</span>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        );
      })}
    </nav>
  );
}
