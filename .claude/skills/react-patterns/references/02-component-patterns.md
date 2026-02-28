# 02. 컴포넌트 패턴

## 핵심 원칙

1. **단일 책임**: 컴포넌트는 하나의 역할만 담당
2. **Props는 coordination만**: 선택 상태, 콜백만 props로 전달
3. **데이터는 직접 접근**: metadata, store는 컴포넌트 내부에서 직접
4. **핵심 정보는 드러내고, 세부 구현은 숨기기**

---

## Props 구분 원칙

이 프로젝트에서 props로 전달할 것과 컴포넌트 내부에서 처리할 것:

| Props로 전달 (coordination) | 컴포넌트 내부에서 처리 |
|-----------------------------|-----------------------|
| `selectedDrawingId` | `useMetadata()` 로 데이터 접근 |
| `selectedDiscipline` | `imageTransform` 계산 |
| `selectedRegion`, `selectedRevision` | `polygon` 좌표 변환 |
| `onSelect`, `onRevisionChange` | 이미지 URL 생성 |
| `overlayDisciplines` | 표시 여부 판단 로직 |

> **단, Zustand store를 직접 구독하는 컴포넌트는 props 없이도 된다.**
> DisciplinePanel, RevisionTimeline 등은 store에서 직접 읽는 것이 더 자연스럽다.

---

## 1. 공종 패널 — DisciplinePanel

### ❌ 잘못된 패턴

```tsx
// 부모가 discipline 데이터를 직접 내려줌
<DisciplinePanel
  disciplines={drawing.disciplines}
  imageTransforms={Object.entries(drawing.disciplines).map(([, d]) => d.imageTransform)}
  polygonTransforms={...}
  selectedDiscipline={selectedDiscipline}
  onSelect={selectDiscipline}
/>
```

**문제:** 부모가 imageTransform, polygonTransform을 알아야 한다. 세부 구현이 인터페이스에 노출됨.

### ✅ 올바른 패턴

```tsx
// 부모는 coordination state만 전달
<DisciplinePanel
  drawingId={selectedDrawingId}
  selectedDiscipline={selectedDiscipline}
  onSelect={selectDiscipline}
/>

// DisciplinePanel 내부에서 데이터 직접 접근
export function DisciplinePanel({ drawingId, selectedDiscipline, onSelect }: Props) {
  const { data } = useMetadata();
  const drawing = data.drawings[drawingId];
  const disciplines = drawing?.disciplines ?? {};

  if (!drawing || drawingId === '00') return null;

  return (
    <div className="border-t">
      <div className="px-3 py-2 text-xs font-medium text-gray-500">공종</div>
      {Object.keys(disciplines).map((name) => (
        <button
          key={name}
          onClick={() => onSelect(name)}
          className={`w-full px-4 py-2 text-left text-sm ${
            selectedDiscipline === name
              ? 'bg-blue-50 text-blue-700 font-medium'
              : 'text-gray-700 hover:bg-gray-50'
          }`}
        >
          {name}
        </button>
      ))}
    </div>
  );
}
```

---

## 2. 리비전 타임라인 — RevisionTimeline

```tsx
// RevisionTimeline은 선택된 drawing + discipline + region으로 revision 목록을 스스로 계산
export function RevisionTimeline() {
  const { selectedDrawingId, selectedDiscipline, selectedRegion, selectedRevision, selectRevision } = useDrawingStore();
  const { data } = useMetadata();

  const drawing = data.drawings[selectedDrawingId];
  const discipline = drawing?.disciplines?.[selectedDiscipline ?? ''];

  if (!discipline) return null;

  // 특수 케이스: region이 있는 경우
  const revisions = selectedRegion
    ? discipline.regions?.[selectedRegion]?.revisions ?? []
    : discipline.revisions;

  return (
    <div className="border-t p-3">
      <div className="text-xs font-medium text-gray-500 mb-2">리비전 이력</div>
      <div className="space-y-1">
        {[...revisions].reverse().map((rev, i) => (
          <RevisionItem
            key={rev.version}
            revision={rev}
            isLatest={i === 0}
            isSelected={selectedRevision === rev.version}
            onSelect={() => selectRevision(rev.version)}
          />
        ))}
      </div>
    </div>
  );
}
```

---

## 3. RegionPanel — 구조 공종 Region A/B 전용

RegionPanel은 구조 공종이 선택되고 region이 있을 때만 표시. 이 판단을 컴포넌트가 직접 한다.

```tsx
export function RegionPanel() {
  const { selectedDrawingId, selectedDiscipline, selectedRegion, selectRegion } = useDrawingStore();
  const { data } = useMetadata();

  const drawing = data.drawings[selectedDrawingId];
  const discipline = drawing?.disciplines?.[selectedDiscipline ?? ''];

  // 자신의 표시 여부를 직접 결정
  if (!discipline?.regions) return null;

  return (
    <div className="border-t px-3 py-2">
      <div className="text-xs font-medium text-gray-500 mb-1">영역</div>
      <div className="flex gap-2">
        {Object.keys(discipline.regions).map((region) => (
          <button
            key={region}
            onClick={() => selectRegion(region)}
            className={`px-3 py-1 rounded text-sm ${
              selectedRegion === region
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Region {region}
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## 4. Props 타입 작성 규칙

### ✅ 올바른 패턴

```tsx
// type으로 명시적 정의, 파일 상단에 위치
type DisciplinePanelProps = {
  drawingId: string;
  selectedDiscipline: string | null;
  onSelect: (discipline: string) => void;
};

export function DisciplinePanel({ drawingId, selectedDiscipline, onSelect }: DisciplinePanelProps) {
  // ...
}
```

### ❌ 잘못된 패턴

```tsx
// 인라인 타입 — 컴포넌트 선언과 섞여서 읽기 어려움
export function DisciplinePanel({
  drawingId,
  selectedDiscipline,
  onSelect,
}: {
  drawingId: string;
  selectedDiscipline: string | null;
  onSelect: (discipline: string) => void;
}) {
  // ...
}
```

---

## 5. 콜백 props 네이밍

```tsx
// ✅ on + 동사 형태
type Props = {
  onSelect: (discipline: string) => void;
  onRevisionChange: (version: string) => void;
  onOverlayToggle: (discipline: string) => void;
};

// ❌ 불명확한 이름
type Props = {
  select: (discipline: string) => void;
  handleRevision: (version: string) => void;
  overlayCallback: (discipline: string) => void;
};
```

---

## 6. 컴포넌트 분리 판단 기준

**분리해야 할 때:**
- 코드 전체를 읽어야 역할을 알 수 있을 때
- 실제로 여러 곳에서 재사용되는 로직 (예: `applyPolygonTransform`)
- 추상화 수준이 달라 같은 파일에 있으면 어색할 때

**분리하면 안 되는 때:**
- 재사용 "가능성"만 있고 실제 재사용은 없는 경우
- 분리하면 관련 코드가 물리적으로 멀어져 오히려 이해가 어려운 경우
- 단순히 줄 수를 줄이려는 기계적 분리

**파일 규모 참고 기준 (강제 아님):**

| 파일 | 참고 줄 수 |
|------|-----------|
| `App.tsx` | ~30줄 |
| `Sidebar.tsx`, `DrawingViewer.tsx` | ~50줄 |
| `DisciplinePanel.tsx`, `RevisionTimeline.tsx` | ~100줄 |
| `DrawingCanvas.tsx` (렌더링 로직 포함) | ~150줄 |

---

## 7. 수렴 방지

> 패턴을 위한 패턴은 피하세요.

| 수렴 패턴 | 이 프로젝트에서의 판단 |
|-----------|----------------------|
| 모든 상태를 Zustand로 | 탐색 상태만 Zustand. 줌 레벨, hover 등 로컬 UI 상태는 `useState` |
| 모든 컴포넌트에 Container/Presentation 분리 | RegionPanel처럼 단순한 컴포넌트는 분리 불필요 |
| 공통 훅 남용 | `useImageTransform`은 필요. 단발성 계산은 컴포넌트 내 직접 작성 |
| 의미없는 추상화 | `getDrawingById(id)` 같은 1줄 래퍼는 그냥 `data.drawings[id]` |

---

## 체크리스트

- [ ] Props 타입이 `type XxxProps = { ... }` 형태로 명시적으로 정의되어 있는가?
- [ ] 콜백 props가 `on + 동사` 형태인가?
- [ ] 컴포넌트가 자신의 표시 여부를 직접 결정하는가?
- [ ] se부 구현(imageTransform 계산, URL 생성)이 props 인터페이스에 노출되지 않는가?
- [ ] 재사용 "가능성"이 아닌 실제 재사용을 기준으로 분리했는가?
