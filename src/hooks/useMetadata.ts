import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import type { Metadata, Drawing, Discipline, Revision } from '../types/drawing';

type MetadataState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: Metadata };

// 자식 도면 목록: drawingId → children[]  (전체 배치도에서 동 목록 렌더링에 사용)
function buildChildrenMap(data: Metadata): Record<string, Drawing[]> {
  const map: Record<string, Drawing[]> = {};
  Object.values(data.drawings).forEach((d) => {
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
): Revision | Record<string, Revision> {
  if (discipline.regions) {
    return Object.fromEntries(
      Object.entries(discipline.regions).map(([key, region]) => [
        key,
        region.revisions[region.revisions.length - 1],
      ])
    );
  }
  return discipline.revisions[discipline.revisions.length - 1];
}

// 해당 공종의 최신 리비전에 변경 내역이 있는지 판별
// BuildingTree에서 공종 아이템 렌더링 시 "변경 있음" 표시에 사용
function hasRecentChange(discipline: Discipline): boolean {
  const latestRevision = discipline.revisions.at(-1);
  return (latestRevision?.changes.length ?? 0) > 0;
}

export function useMetadata() {
  const [state, setState] = useState<MetadataState>({ status: 'loading' });

  useEffect(() => {
    axios
      .get<Metadata>('/data/metadata.json')
      .then((res) => setState({ status: 'success', data: res.data }))
      .catch((err: unknown) =>
        setState({ status: 'error', message: String(err) })
      );
  }, []);

  const childrenMap = useMemo(() => {
    if (state.status !== 'success') return {};
    return buildChildrenMap(state.data);
  }, [state]);

  return {
    state,
    childrenMap,
    getLatestRevision,
    hasRecentChange,
  };
}
