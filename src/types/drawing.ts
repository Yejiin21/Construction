export interface Project {
  name: string; // '샘플 아파트 단지'
  unit: string; // 'px'
}

export interface DisciplineInfo {
  name: string; // '건축', '구조', '설비' 등
}

// imageTransform / polygonTransform 공통 기반
export interface Transform {
  x: number; // 앵커 포인트 X 좌표 (px)
  y: number; // 앵커 포인트 Y 좌표 (px)
  scale: number; // 확대/축소 비율 (1.0 = 동일 크기)
  rotation: number; // 회전 각도 (라디안, 0 = 회전 없음)
}

// 이미지 정렬 변환 — 기준 이미지 위에 오버레이 이미지를 겹치기 위한 변환
export interface ImageTransform extends Transform {
  relativeTo?: string; // 기준 이미지 파일명. position 레벨에서는 parent가 대신하므로 없음
}

// 폴리곤 렌더링 변환 — polygon.vertices 좌표를 이미지 위에 그리기 위한 변환
export type PolygonTransform = Transform;

export interface Polygon {
  vertices: [number, number][]; // 다각형 꼭짓점 좌표 배열
  polygonTransform: PolygonTransform; // 꼭짓점을 화면 좌표로 변환하기 위한 변환
}

export interface Revision {
  version: string; // 'REV1', 'REV2A' 등
  image: string; // 도면 이미지 파일명
  date: string; // 발행일 'YYYY-MM-DD'
  description: string; // 리비전 설명
  changes: string[]; // 변경 내역 배열 (빈 배열이면 초기 설계)
  imageTransform?: ImageTransform; // region revision에서 사용 — relativeTo: 구조 도면
  polygon?: Polygon; // revision별 polygon이 다를 때 (주민공동시설 건축)
}

export interface Region {
  polygon: Polygon; // 해당 영역의 폴리곤
  revisions: Revision[]; // 해당 영역의 리비전 배열
}

export interface Discipline {
  imageTransform?: ImageTransform; // 이 공종 이미지를 기준 도면에 정렬하기 위한 변환
  image?: string; // 공종 자체 도면 이미지 (region이 있는 경우)
  polygon?: Polygon; // 이 공종이 다루는 관심 영역
  regions?: Record<string, Region>; // 하위 영역 분할 (구조 공종 A/B 등)
  revisions?: Revision[]; // 리비전 이력 배열 (region이 있는 공종은 discipline 레벨에 없을 수 있음)
}

export interface Position {
  vertices: [number, number][]; // 상위 도면에서 이 건물이 차지하는 영역
  imageTransform: Omit<ImageTransform, "relativeTo">; // position 레벨은 parent 도면이 기준
}

export interface Drawing {
  id: string; // '00', '01', '09' 등
  name: string; // '전체 배치도', '101동 지상1층 평면도' 등
  image: string; // 도면 기본 이미지 파일명
  parent: string | null; // 상위 도면 id. 전체 배치도는 null
  position: Position | null; // 상위 도면에서 이 건물의 위치. 전체 배치도는 null
  disciplines?: Record<string, Discipline>; // 공종별 데이터. 전체 배치도에는 없음
}

export interface Metadata {
  project: Project;
  disciplines: DisciplineInfo[]; // 사용되는 공종 목록
  drawings: Record<string, Drawing>; // 키: drawing id ('00', '01' ...)
}
