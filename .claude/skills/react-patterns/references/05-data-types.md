# 05. 데이터 타입 & 구조

## TypeScript 타입 정의

`src/types/drawing.ts`에 전체 타입을 정의한다.

```typescript
// src/types/drawing.ts

export interface Project {
  name: string;  // '샘플 아파트 단지'
  unit: string;  // 'px'
}

export interface DisciplineInfo {
  name: string;  // '건축', '구조', '설비' 등
}

// imageTransform / polygonTransform 공통 기반
export interface Transform {
  x: number;        // 앵커 포인트 X 좌표 (px)
  y: number;        // 앵커 포인트 Y 좌표 (px)
  scale: number;    // 확대/축소 비율 (1.0 = 동일 크기)
  rotation: number; // 회전 각도 (라디안, 0 = 회전 없음)
}

// 이미지 정렬 변환 — 기준 이미지 위에 오버레이 이미지를 겹치기 위한 변환
export interface ImageTransform extends Transform {
  relativeTo?: string; // 기준 이미지 파일명. position 레벨에서는 parent가 대신하므로 없음
}

// 폴리곤 렌더링 변환 — polygon.vertices 좌표를 이미지 위에 그리기 위한 변환
export interface PolygonTransform extends Transform {}

export interface Polygon {
  vertices: [number, number][];        // 다각형 꼭짓점 좌표 배열
  polygonTransform: PolygonTransform;  // 꼭짓점을 화면 좌표로 변환하기 위한 변환
}

export interface Revision {
  version: string;          // 'REV1', 'REV2A' 등
  image: string;            // 도면 이미지 파일명
  date: string;             // 발행일 'YYYY-MM-DD'
  description: string;      // 리비전 설명
  changes: string[];        // 변경 내역 배열 (빈 배열이면 초기 설계)
  imageTransform?: ImageTransform; // region revision에서 사용 — relativeTo: 구조 도면
  polygon?: Polygon;               // revision별 polygon이 다를 때 (주민공동시설 건축)
}

export interface Region {
  polygon: Polygon;       // 해당 영역의 폴리곤
  revisions: Revision[];  // 해당 영역의 리비전 배열
}

export interface Discipline {
  imageTransform?: ImageTransform; // 이 공종 이미지를 기준 도면에 정렬하기 위한 변환
  image?: string;                  // 공종 자체 도면 이미지 (구조처럼 region이 있는 경우)
  polygon?: Polygon;               // 이 공종이 다루는 관심 영역
  regions?: Record<string, Region>; // 하위 영역 분할 (구조 공종 A/B 등)
  revisions: Revision[];           // 리비전 이력 배열 (필수)
}

export interface Position {
  vertices: [number, number][];              // 상위 도면에서 이 건물이 차지하는 영역
  imageTransform: Omit<ImageTransform, 'relativeTo'>; // position 레벨은 parent 도면이 기준
}

export interface Drawing {
  id: string;                              // '00', '01', '09' 등
  name: string;                            // '전체 배치도', '101동 지상1층 평면도' 등
  image: string;                           // 도면 기본 이미지 파일명
  parent: string | null;                   // 상위 도면 id. 전체 배치도는 null
  position: Position | null;               // 상위 도면에서 이 건물의 위치. 전체 배치도는 null
  disciplines?: Record<string, Discipline>; // 공종별 데이터. 전체 배치도에는 없음
}

export interface Metadata {
  project: Project;
  disciplines: DisciplineInfo[];         // 사용되는 공종 목록
  drawings: Record<string, Drawing>;     // 키: drawing id ('00', '01' ...)
}
```

---

## relativeTo 매핑 — 기준 도면 관계

`imageTransform.relativeTo`가 가리키는 기준 이미지:

| 도면 | 공종 | relativeTo (기준 이미지) |
|------|------|--------------------------|
| 101동 | 건축, 공조설비, 구조, 배관설비, 소방 | `01_101동 지상1층 평면도_건축.png` |
| 101동 | 구조 region A/B (revision) | `04_101동 지상1층 평면도_구조.png` |
| 주민공동시설 | 건축 (revision), 구조, 설비, 소방 | `09_주민공동시설_지상1층 평면도_건축.png` |
| 주차장 | 구조, 소방, 설비, 조경 | `13_주차장 지상1층 확대 평면도_구조.png` |

---

## 특수 케이스별 데이터 구조

### 케이스 1: region이 있는 구조 공종 (101동 구조)

```
discipline['구조'] = {
  image: '04_101동 지상1층 평면도_구조.png',
  polygon: { vertices: [...], polygonTransform: {...} },  // 구조 전체 영역
  regions: {
    'A': {
      polygon: { vertices: [...], polygonTransform: {...} },  // A 영역
      revisions: [
        { version: 'REV1A', image: '05_...REV1A.png', imageTransform: { relativeTo: '04_구조.png', ... } },
        { version: 'REV2A', image: '05_...REV2A.jpeg', imageTransform: { relativeTo: '04_구조.png', ... } }
      ]
    },
    'B': { ... }
  },
  revisions: []  // region이 있는 경우 discipline 레벨 revisions는 비어있음
}
```

### 케이스 2: revision별 polygon이 다름 (주민공동시설 건축)

```
discipline['건축'] = {
  // imageTransform 없음
  // polygon 없음
  revisions: [
    {
      version: 'REV1',
      image: '09_주민공동시설_...건축_REV1.jpeg',
      imageTransform: { relativeTo: '09_건축.png', ... },  // revision마다 별도
      polygon: { vertices: [...], polygonTransform: {...} }  // revision마다 별도
    },
    { version: 'REV2', imageTransform: {...}, polygon: {...} },
    { version: 'REV3', imageTransform: {...}, polygon: {...} }
  ]
}
```

### 케이스 3: polygon 없는 공종 (주차장 구조)

```
discipline['구조'] = {
  imageTransform: { relativeTo: '13_주차장_구조.png', ... },
  // image 없음
  // polygon 없음 — 기준 도면 자체이므로 관심 영역 지정 불필요
  revisions: [
    { version: 'REV1', image: '13_주차장_구조.png', ... }
  ]
}
```

---

## 데이터 파일 접근 설정

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

이미지 URL 생성 (public 폴더에 drawings/ 복사 또는 심볼릭 링크):
```typescript
// public/drawings/ 에 이미지 파일이 있다고 가정
const imageUrl = `/drawings/${drawing.image}`;

// tsconfig.json에서 JSON import 허용
// "resolveJsonModule": true
import metadata from '../data/metadata.json';
```

---

## 체크리스트

- [ ] 모든 optional 필드가 `?`로 표시되어 있는가?
- [ ] `relativeTo`가 있는 케이스를 올바르게 처리하는가?
- [ ] `revisions.at(-1)` 또는 마지막 인덱스로 최신 리비전을 가져오는가?
- [ ] `discipline.regions`로 region 존재 여부를 판별하는가?
