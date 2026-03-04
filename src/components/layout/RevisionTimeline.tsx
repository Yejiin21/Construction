import { useState } from 'react';
import { useDrawingStore } from '../../store/drawingStore';
import { useMetadata } from '../../hooks/useMetadata';
import type { Revision } from '../../types/drawing';

export function RevisionTimeline() {
  const {
    selectedDrawingId,
    selectedDiscipline,
    selectedRegion,
    selectedRevision,
    selectRevision,
  } = useDrawingStore();
  const { data } = useMetadata();
  const [hoveredVersion, setHoveredVersion] = useState<string | null>(null);

  const drawing = data.drawings[selectedDrawingId];
  const discipline = drawing?.disciplines?.[selectedDiscipline ?? ''];
  if (!discipline) return null;

  const revisions: Revision[] = selectedRegion
    ? (discipline.regions?.[selectedRegion]?.revisions ?? [])
    : (discipline.revisions ?? []);

  if (revisions.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1">
      {revisions.map((rev, i) => {
        const isLatest = i === revisions.length - 1;
        const isSelected = selectedRevision === rev.version;

        return (
          <div key={rev.version} className="flex items-center gap-1">
            {i > 0 && <span className="text-gray-300 text-xs">→</span>}

            <div className="relative">
              <button
                onClick={() => selectRevision(rev.version)}
                onMouseEnter={() => setHoveredVersion(rev.version)}
                onMouseLeave={() => setHoveredVersion(null)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {rev.version}
                {isLatest && (
                  <span
                    className={`text-[10px] px-1 rounded ${
                      isSelected ? 'bg-blue-500 text-blue-100' : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    최신
                  </span>
                )}
              </button>

              {/* hover 툴팁 — 날짜 + 설명 + 변경 내역 */}
              {hoveredVersion === rev.version && (
                <div className="absolute bottom-full left-0 mb-2 z-10 bg-gray-800 text-white text-xs rounded-md p-2.5 w-52 shadow-lg pointer-events-none">
                  <div className="font-semibold">{rev.version}</div>
                  <div className="text-gray-400 mt-0.5">{rev.date}</div>
                  {rev.description && (
                    <div className="text-gray-300 mt-1">{rev.description}</div>
                  )}
                  {rev.changes.length > 0 && (
                    <ul className="mt-1.5 space-y-0.5 text-gray-200">
                      {rev.changes.map((change, j) => (
                        <li key={j}>• {change}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
