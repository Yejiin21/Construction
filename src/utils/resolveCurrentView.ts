import type { Drawing, Discipline, Polygon } from "../types/drawing";

interface ViewResult {
  imageUrl: string;
  polygon: Polygon | undefined;
}

/**
 * 도면의 기준 이미지(drawing.image)에 대응하는 base 공종명을 반환.
 * metadata 규칙: 다른 이미지들이 relativeTo로 이 base 이미지를 가리키며,
 * 파일명은 ..._<공종명>.(png|jpeg|jpg) 형태.
 */
export function getBaseDisciplineForDrawing(drawing: Drawing): string | null {
  if (!drawing?.disciplines || !drawing.image) return null;
  const match = drawing.image.match(/_([^_.]+)\.(png|jpe?g)$/i);
  if (!match) return null;
  const name = match[1];
  return drawing.disciplines[name] ? name : null;
}

export function resolveCurrentView(
  drawing: Drawing | undefined,
  discipline: Discipline | undefined,
  selectedRegion: string | null,
  selectedRevision: string | null,
): ViewResult {
  // 케이스 1: 도면 없음 — 기본값
  if (!drawing)
    return { imageUrl: "/data/drawings/00_전체.png", polygon: undefined };

  // 케이스 2: 공종 미선택 — 도면 기본 이미지
  if (!discipline) {
    return { imageUrl: `/data/drawings/${drawing.image}`, polygon: undefined };
  }

  // 케이스 3: region이 있는 구조 공종 (101동 구조 A/B)
  if (discipline.regions && selectedRegion) {
    const region = discipline.regions[selectedRegion];
    const revision =
      region?.revisions.find((r) => r.version === selectedRevision) ??
      region?.revisions.at(-1);
    return {
      imageUrl: `/data/drawings/${revision?.image ?? drawing.image}`,
      polygon: region?.polygon,
    };
  }

  // 케이스 4: revision별 polygon이 다른 경우 (주민공동시설 건축)
  // discipline에 imageTransform/polygon이 없고, 각 revision에 개별 polygon이 있음
  if (!discipline.imageTransform && !discipline.polygon) {
    const revision =
      discipline.revisions?.find((r) => r.version === selectedRevision) ??
      discipline.revisions?.at(-1);
    return {
      imageUrl: `/data/drawings/${revision?.image ?? drawing.image}`,
      polygon: revision?.polygon,
    };
  }

  // 케이스 5: 일반 케이스 (polygon 없음 포함 — 주차장 구조)
  const revision =
    discipline.revisions?.find((r) => r.version === selectedRevision) ??
    discipline.revisions?.at(-1);
  return {
    imageUrl: `/data/drawings/${revision?.image ?? drawing.image}`,
    polygon: discipline.polygon, // undefined이면 PolygonOverlay 렌더링 안 됨
  };
}
