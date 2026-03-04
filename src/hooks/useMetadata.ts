import { useMemo } from 'react';
import metadataJson from '../data/metadata.json';
import type { Metadata, Drawing, Discipline, Revision } from '../types/drawing';

const data = metadataJson as unknown as Metadata;

// 자식 도면 목록: drawingId → children[]  (전체 배치도에서 동 목록 렌더링에 사용)
function buildChildrenMap(metadata: Metadata): Record<string, Drawing[]> {
  const map: Record<string, Drawing[]> = {};
  Object.values(metadata.drawings).forEach((d) => {
    if (d.parent) {
      map[d.parent] = map[d.parent] ?? [];
      map[d.parent].push(d);
    }
  });
  return map;
}

// 최신 리비전 가져오기
// - region이 없는 경우: 배열의 마지막 revision
// - region이 있는 경우: 각 region별 마지막 revision 반환
function getLatestRevision(
  discipline: Discipline
): Revision | Record<string, Revision> | undefined {
  if (discipline.regions) {
    return Object.fromEntries(
      Object.entries(discipline.regions).map(([key, region]) => [
        key,
        region.revisions[region.revisions.length - 1],
      ])
    );
  }
  return discipline.revisions?.at(-1);
}

// 해당 공종의 최신 리비전에 변경 내역이 있는지 판별
// BuildingTree에서 공종 아이템 렌더링 시 "변경 있음" 표시에 사용
function hasRecentChange(discipline: Discipline): boolean {
  const latestRevision = discipline.revisions?.at(-1);
  return (latestRevision?.changes.length ?? 0) > 0;
}

const childrenMapCache = buildChildrenMap(data);

export function useMetadata() {
  // childrenMap은 데이터가 정적이므로 모듈 초기화 시 1회만 계산
  const childrenMap = useMemo(() => childrenMapCache, []);

  return {
    data,
    childrenMap,
    getLatestRevision,
    hasRecentChange,
  };
}
