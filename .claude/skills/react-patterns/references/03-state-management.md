# 03. 상태 관리

## 상태 유형별 관리 방법

| 상태 유형 | 관리 방법 | 예시 |
|----------|----------|------|
| 도면 탐색 상태 | Zustand (`drawingStore`) | 선택된 drawing, discipline, revision |
| 오버레이 상태 | Zustand (`drawingStore`) | `isOverlayMode`, `overlayDisciplines[]` |
| 로컬 UI 상태 | `useState` | 줌 레벨, hover, 이미지 로드 여부 |
| 파생 데이터 | `useMemo` | childrenMap, 최신 리비전 계산 |

---

## 1. Zustand 스토어 — drawingStore

오버레이는 단순 공종명 목록이 아닌 **공종별 독립 설정 객체**로 관리한다.
각 오버레이마다 어떤 revision을 볼지, 투명도를 얼마로 할지 독립적으로 제어한다.

```typescript
// src/store/drawingStore.ts
import { create } from 'zustand';

// 오버레이 공종별 설정 (단순 string[] 대신)
interface OverlayDiscipline {
  disciplineName: string;   // '구조', '설비' 등
  revision: string;         // 선택된 revision version
  opacity: number;          // 0~100 (숫자 직접 입력 + ▲▼ 1단위 조절)
}

interface DrawingState {
  selectedDrawingId: string;
  selectedDiscipline: string | null;
  selectedRegion: string | null;
  selectedRevision: string | null;
  isOverlayMode: boolean;                   // '비교하기' 버튼으로 진입. 퇴장 시 overlay 초기화
  overlayDisciplines: OverlayDiscipline[];  // 공종별 독립 설정
  baseOpacity: number;                      // base 공종 투명도 (0~100)

  selectDrawing: (id: string) => void;
  selectDiscipline: (discipline: string | null) => void;
  selectRegion: (region: string | null) => void;
  selectRevision: (version: string | null) => void;
  enterOverlayMode: () => void;
  exitOverlayMode: () => void;  // isOverlayMode=false + overlayDisciplines + baseOpacity 초기화
  addOverlay: (disciplineName: string, revision: string) => void;
  removeOverlay: (disciplineName: string) => void;
  updateOverlayOpacity: (disciplineName: string, opacity: number) => void;
  updateOverlayRevision: (disciplineName: string, revision: string) => void;
  setBaseOpacity: (opacity: number) => void;
}

export const useDrawingStore = create<DrawingState>((set) => ({
  selectedDrawingId: '00',
  selectedDiscipline: null,
  selectedRegion: null,
  selectedRevision: null,
  isOverlayMode: false,
  overlayDisciplines: [],
  baseOpacity: 100,

  selectDrawing: (id) =>
    set({
      selectedDrawingId: id,
      selectedDiscipline: null,
      selectedRegion: null,
      selectedRevision: null,
      isOverlayMode: false,
      overlayDisciplines: [],
      baseOpacity: 100,
    }),

  selectDiscipline: (discipline) =>
    set({ selectedDiscipline: discipline, selectedRegion: null, selectedRevision: null }),

  selectRegion: (region) =>
    set({ selectedRegion: region, selectedRevision: null }),

  selectRevision: (version) =>
    set({ selectedRevision: version }),

  enterOverlayMode: () => set({ isOverlayMode: true }),

  // 모드 종료 + overlay 초기화를 한 번에 처리 (나갔다 돌아와도 이전 설정 잔존 방지)
  exitOverlayMode: () =>
    set({ isOverlayMode: false, overlayDisciplines: [], baseOpacity: 100 }),

  // 오버레이 추가 시 기본 opacity 70, 최신 revision 자동 설정
  addOverlay: (disciplineName, revision) =>
    set((s) => ({
      overlayDisciplines: s.overlayDisciplines.some((o) => o.disciplineName === disciplineName)
        ? s.overlayDisciplines
        : [...s.overlayDisciplines, { disciplineName, revision, opacity: 70 }],
    })),

  removeOverlay: (disciplineName) =>
    set((s) => ({
      overlayDisciplines: s.overlayDisciplines.filter((o) => o.disciplineName !== disciplineName),
    })),

  updateOverlayOpacity: (disciplineName, opacity) =>
    set((s) => ({
      overlayDisciplines: s.overlayDisciplines.map((o) =>
        o.disciplineName === disciplineName
          ? { ...o, opacity: Math.max(0, Math.min(100, opacity)) }
          : o
      ),
    })),

  updateOverlayRevision: (disciplineName, revision) =>
    set((s) => ({
      overlayDisciplines: s.overlayDisciplines.map((o) =>
        o.disciplineName === disciplineName ? { ...o, revision } : o
      ),
    })),

  setBaseOpacity: (opacity) =>
    set({ baseOpacity: Math.max(0, Math.min(100, opacity)) }),
}));
```

---

## 2. base 공종 자동 감지 — detectBaseDiscipline

```typescript
// src/utils/detectBaseDiscipline.ts
// 다른 공종들의 relativeTo가 가리키는 이미지를 가진 공종이 base
// 101동: 건축, 주차장: 구조 — 데이터 구조에서 자동 결정

export function detectBaseDiscipline(
  disciplines: Record<string, Discipline>
): string | null {
  const allRelativeTo = new Set(
    Object.values(disciplines).flatMap((d) => [
      d.imageTransform?.relativeTo,
      ...d.revisions.map((r) => r.imageTransform?.relativeTo),
    ]).filter(Boolean)
  );

  const base = Object.entries(disciplines).find(([, d]) =>
    d.image && allRelativeTo.has(d.image)
  );

  return base?.[0] ?? null;  // '건축', '구조' 등 공종명 반환
}
```

---

## 2. Zustand vs useState 판단 기준

### Zustand로 관리할 것

- 여러 컴포넌트가 함께 읽고 변경하는 상태
- 컴포넌트 트리를 가로질러 공유되는 상태

```typescript
// ✅ Zustand — 여러 컴포넌트가 함께 사용
// BuildingList에서 selectDrawing 호출
// DisciplinePanel에서 selectedDrawingId 읽음
// DrawingCanvas에서 selectedRevision 읽음
const { selectedDrawingId, selectDrawing } = useDrawingStore();
```

### useState로 관리할 것

- 특정 컴포넌트에서만 사용하는 UI 상태

```typescript
// ✅ useState — DrawingCanvas 내부에서만 필요한 상태
const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
const [zoomLevel, setZoomLevel] = useState(1);
const [isDragging, setIsDragging] = useState(false);
```

### ❌ 잘못된 패턴: 모든 상태를 Zustand로

```typescript
// ❌ 줌 레벨을 Zustand에 넣을 필요 없음 — 다른 컴포넌트가 사용하지 않음
interface DrawingState {
  selectedDrawingId: string;
  zoomLevel: number;        // ← 불필요한 글로벌 상태
  isImageLoading: boolean;  // ← 불필요한 글로벌 상태
  hoverDiscipline: string;  // ← 불필요한 글로벌 상태
}
```

---

## 3. useMetadata 훅 — 파생 데이터

```typescript
// src/hooks/useMetadata.ts
import { useMemo } from 'react';
import metadata from '../../data/metadata.json';
import type { Metadata, Drawing, Discipline } from '../types/drawing';

export function useMetadata() {
  const data = metadata as Metadata;

  // 자식 도면 목록: drawingId → children[]
  // (전체 배치도에서 동 목록 렌더링에 사용)
  const childrenMap = useMemo(() => {
    const map: Record<string, Drawing[]> = {};
    Object.values(data.drawings).forEach((d) => {
      if (d.parent) {
        map[d.parent] = map[d.parent] ?? [];
        map[d.parent].push(d);
      }
    });
    return map;
  }, []);

  // 최신 리비전 가져오기
  // - region이 없는 경우: 배열의 마지막 revision
  // - region이 있는 경우: 각 region별 마지막 revision 반환
  function getLatestRevision(discipline: Discipline) {
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

  return { data, childrenMap, getLatestRevision };
}
```

---

## 4. 상태 초기화 패턴 — 하위 상태 연쇄 초기화

탐색 계층이 변경될 때 하위 상태를 초기화하는 것은 도메인 규칙이다. store action에서 처리한다.

```typescript
// ✅ store action에서 연쇄 초기화 — 컴포넌트는 selectDrawing만 호출
selectDrawing: (id) =>
  set({
    selectedDrawingId: id,
    selectedDiscipline: null,  // 동이 바뀌면 공종 초기화
    selectedRegion: null,       // 공종이 초기화되면 region도
    selectedRevision: null,     // revision도
    overlayDisciplines: [],     // 오버레이도
  }),
```

```typescript
// ❌ 컴포넌트에서 직접 초기화 — 분산된 책임
function BuildingList() {
  const { selectDrawing, selectDiscipline, selectRegion, selectRevision } = useDrawingStore();

  function handleBuildingClick(id: string) {
    selectDrawing(id);
    selectDiscipline(null);   // ← 컴포넌트가 알 필요 없는 일
    selectRegion(null);       // ← 컴포넌트가 알 필요 없는 일
    selectRevision(null);     // ← 컴포넌트가 알 필요 없는 일
  }
}
```

---

## 5. 공종 선택 시 최신 리비전 자동 선택

```typescript
// DisciplinePanel에서 공종 선택 시
function handleDisciplineSelect(disciplineName: string) {
  selectDiscipline(disciplineName); // store action이 revision도 null로 초기화

  // 최신 리비전 자동 선택
  const discipline = drawing?.disciplines?.[disciplineName];
  if (!discipline) return;

  if (discipline.regions) {
    // region이 있으면 첫 번째 region 자동 선택
    const firstRegion = Object.keys(discipline.regions)[0];
    selectRegion(firstRegion);
    const latestRev = discipline.regions[firstRegion].revisions.at(-1);
    if (latestRev) selectRevision(latestRev.version);
  } else {
    const latestRev = discipline.revisions.at(-1);
    if (latestRev) selectRevision(latestRev.version);
  }
}
```

---

## 6. "변경 있음" 판별 로직

```typescript
// 해당 공종의 최신 리비전 changes가 비어있지 않으면 변경 있음
// BuildingTree에서 공종 아이템 렌더링 시 사용

function hasRecentChange(discipline: Discipline): boolean {
  const latestRevision = discipline.revisions.at(-1);
  return (latestRevision?.changes.length ?? 0) > 0;
}

// 사용 예시: 색상 강조 + 점으로 표시
<span className={hasRecentChange(discipline) ? 'text-blue-600 font-medium' : 'text-gray-700'}>
  {disciplineName}
  {hasRecentChange(discipline) && (
    <span className="ml-1 w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
  )}
</span>
```

---

## 체크리스트

- [ ] 여러 컴포넌트가 공유하는 탐색 상태는 Zustand인가?
- [ ] 컴포넌트 로컬 UI 상태(줌/팬, hover)는 useState인가?
- [ ] 하위 상태 초기화 로직이 store action에 응집되어 있는가?
- [ ] 공종 선택 시 최신 리비전이 자동으로 선택되는가?
- [ ] `overlayDisciplines`가 `string[]`이 아닌 `OverlayDiscipline[]`인가?
- [ ] `isOverlayMode`가 boolean으로 관리되는가?
- [ ] `exitOverlayMode()`가 overlayDisciplines와 baseOpacity도 함께 초기화하는가?
- [ ] `selectDrawing()`이 `isOverlayMode`도 false로 초기화하는가?
- [ ] `detectBaseDiscipline()`으로 base를 자동 감지하는가?
- [ ] `useMemo`로 파생 데이터를 캐싱하는가?
