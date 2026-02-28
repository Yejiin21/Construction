# 01. 레이아웃 구조

## 핵심 원칙

**App.tsx는 레이아웃 조합만 담당한다. 탐색 로직, 상태 관리, 렌더링 세부 구현은 하위 컴포넌트에 위임한다.**

---

## 파일 디렉토리 구조

```
src/
├── App.tsx                      # 레이아웃 조합만 (~30줄)
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx          # 좌측 트리 탐색 패널 조합
│   │   ├── DrawingViewer.tsx    # 우측 도면 뷰어 조합 (캔버스 + 오버레이 컨트롤)
│   │   └── RevisionBar.tsx      # 하단 리비전 타임라인 바
│   ├── navigation/
│   │   ├── BuildingTree.tsx     # 공간 중심 트리 (단지→동→공종→region)
│   │   ├── DisciplinePanel.tsx  # 공종 선택 패널
│   │   └── RegionPanel.tsx      # Region A/B 선택 (구조 공종 전용)
│   ├── viewer/
│   │   ├── DrawingCanvas.tsx    # 도면 이미지 + 폴리곤 렌더링
│   │   ├── PolygonOverlay.tsx   # SVG 폴리곤 영역 표시
│   │   ├── ImageOverlay.tsx     # 공종 이미지 오버레이 (겹쳐보기)
│   │   ├── CompareButton.tsx    # 비교하기 버튼 
│   │   └── OverlayControlBar.tsx # 오버레이 투명도 제어 바 s
│   └── common/
│       ├── Breadcrumb.tsx       # 현재 위치 컨텍스트 표시
│       └── RevisionBadge.tsx    # 리비전 버전 배지
├── hooks/
│   ├── useMetadata.ts           # metadata.json 파싱 + 파생 데이터
│   └── useImageTransform.ts     # imageTransform CSS 계산
├── store/
│   └── drawingStore.ts          # Zustand 탐색 상태 스토어
├── types/
│   └── drawing.ts               # 전체 TypeScript 타입 정의
└── utils/
    ├── transform.ts             # 좌표 변환 유틸 (polygonTransform 등)
    ├── resolveCurrentView.ts    # 특수 케이스 처리 — 표시할 이미지/polygon 결정
    └── detectBaseDiscipline.ts  # relativeTo 역추적으로 base 공종 자동 감지
```

---

## App.tsx — 추상화 수준 통일

### ❌ 잘못된 패턴

```tsx
export function App() {
  return (
    <div className="flex h-screen">
      <Sidebar />                                   {/* 높은 추상화 */}
      <div className="flex-1 flex flex-col">        {/* 낮은 추상화 — 섞임 */}
        <nav className="flex items-center gap-1">   {/* 낮은 추상화 */}
          <span>전체 배치도</span>
          <span>›</span>
          <span>101동</span>
        </nav>
        <DrawingViewer />                            {/* 높은 추상화 */}
      </div>
    </div>
  );
}
```

**문제:** Sidebar, DrawingViewer는 컴포넌트 이름으로 읽히는데, nav/span은 마크업을 직접 읽어야 한다. 추상화 수준이 섞이면 코드를 읽는 사고가 널뛴다.

### ✅ 올바른 패턴

```tsx
// src/App.tsx — 레이아웃 조합만, 20~30줄
export function App() {
  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 flex flex-col overflow-hidden">
          <Breadcrumb />
          <DrawingViewer />
        </main>
      </div>
      <RevisionBar />   {/* 하단 리비전 타임라인 — 항상 하단 고정 */}
    </div>
  );
}
```

**규칙:** App.tsx의 모든 자식은 같은 추상화 수준(컴포넌트 이름)이어야 한다.

**레이아웃 구조:**
```
┌──────────────────────────────────────────────┐
│  Sidebar  │         DrawingViewer             │
│  (트리)   │  Breadcrumb                       │
│           │  ┌────────────────────────────┐   │
│           │  │ OverlayControlBar (상단)    │   │
│           │  │                            │   │
│           │  │      DrawingCanvas         │   │
│           │  │                  [비교하기] │   │
│           │  └────────────────────────────┘   │
├──────────────────────────────────────────────┤
│              RevisionBar (하단)               │
└──────────────────────────────────────────────┘
```

---

## Sidebar.tsx — wiki 스타일 트리 탐색

Sidebar는 `BuildingTree` 하나만 담당한다. 트리 내에서 동 → 공종 → region 탐색이 모두 이루어진다.
RevisionTimeline은 더 이상 사이드바에 없다 — 하단 `RevisionBar`로 분리.

### ✅ 올바른 패턴

```tsx
// src/components/layout/Sidebar.tsx
export function Sidebar() {
  return (
    <aside className="w-72 shrink-0 bg-white border-r flex flex-col overflow-hidden">
      <div className="p-4 border-b">
        <h1 className="text-sm font-semibold text-gray-900">샘플 아파트 단지</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        <BuildingTree />   {/* wiki 트리: 동 → 공종 → region 전체 포함 */}
      </div>
    </aside>
  );
}
```

### BuildingTree — 공간 중심 트리

```tsx
// 트리 구조: 단지 > 동 > 공종 > region (있는 경우)
// 각 항목 클릭 시 해당 계층 선택 + 하위 상태 초기화

▼ 샘플 아파트 단지
  ▼ 101동
    ─ 건축   ● 2024-03-15  ← changes 있음 표시 (색상 강조 + 점)
    ▼ 구조                  ← region 있는 공종은 펼침 가능
      ─ Region A
      ─ Region B
    ─ 공조설비
    ─ 배관설비
    ─ 소방
  ▶ 주민공동시설
  ▶ 주차장
```

**"변경 있음" 표시 기준**: 해당 공종의 가장 최신 리비전 `changes.length > 0`

```tsx
// 공종 변경 여부 판별
function hasRecentChange(discipline: Discipline): boolean {
  const latestRevision = discipline.revisions.at(-1);
  return (latestRevision?.changes.length ?? 0) > 0;
}
```
```

### ❌ 잘못된 패턴

```tsx
// Sidebar에서 상태를 직접 읽어서 조건 렌더링
export function Sidebar() {
  const { selectedDiscipline, selectedDrawingId } = useDrawingStore();
  const { data } = useMetadata();
  const drawing = data.drawings[selectedDrawingId];
  const discipline = drawing?.disciplines?.[selectedDiscipline ?? ''];

  return (
    <aside>
      <BuildingList />
      {selectedDrawingId !== '00' && <DisciplinePanel />}
      {discipline?.regions && <RegionPanel />}   {/* ← 이 판단을 RegionPanel이 직접 해야 함 */}
      {selectedDiscipline && <RevisionTimeline />}
    </aside>
  );
}
```

**문제:** Sidebar가 RegionPanel의 표시 조건을 알아야 한다. RegionPanel이 자신의 표시 여부를 결정하는 것이 응집도가 높다.

---

## DrawingViewer.tsx — 뷰어 조합

```tsx
// src/components/layout/DrawingViewer.tsx
export function DrawingViewer() {
  return (
    <div className="flex-1 relative overflow-hidden bg-gray-100">
      <OverlayControlBar />   {/* 오버레이 활성 시에만 내부적으로 표시 */}
      <div className="relative flex-1 overflow-auto">
        <DrawingCanvas />
        <CompareButton />     {/* 캔버스 우상단 고정 — base 공종 선택 시 표시 */}
      </div>
    </div>
  );
}
```

### CompareButton — 비교하기 버튼

캔버스 우상단에 고정. base 공종이 선택된 상태에서만 표시되며, 클릭 시 overlay 모드 진입.

```tsx
export function CompareButton() {
  const { selectedDiscipline } = useDrawingStore();
  if (!selectedDiscipline) return null;

  return (
    <button
      className="absolute top-3 right-3 z-10 px-3 py-1.5 bg-white border border-gray-300
                 rounded text-sm text-gray-700 shadow-sm hover:bg-gray-50"
      onClick={() => { /* 오버레이 패널 열기 */ }}
    >
      비교하기
    </button>
  );
}
```

### RevisionBar — 하단 리비전 타임라인

```tsx
// src/components/layout/RevisionBar.tsx
// 선택된 drawing + discipline + region의 revision 목록을 가로로 표시
// 각 revision에 커서 올리면 tooltip으로 date + description + changes 표시

export function RevisionBar() {
  const { selectedDiscipline } = useDrawingStore();
  if (!selectedDiscipline) return null;   // 공종 미선택 시 미표시

  return (
    <div className="h-16 border-t bg-white px-4 flex items-center gap-3 shrink-0">
      <span className="text-xs text-gray-500 shrink-0">리비전 이력</span>
      <RevisionTimeline />   {/* 가로 타임라인 — hover시 tooltip */}
    </div>
  );
}
```

---

## 컴포넌트 명명 규칙

| 역할 | 패턴 | 예시 |
|------|------|------|
| 레이아웃 조합 | `[Feature]Viewer`, `[Feature]Sidebar` | `DrawingViewer`, `Sidebar` |
| 탐색 패널 | `[Entity]Panel`, `[Entity]List` | `DisciplinePanel`, `BuildingList` |
| 타임라인/히스토리 | `[Entity]Timeline` | `RevisionTimeline` |
| 렌더링 컴포넌트 | `[Entity]Canvas`, `[Entity]Overlay` | `DrawingCanvas`, `PolygonOverlay` |
| 상태 표시 | `[Entity]Badge`, `[Entity]Breadcrumb` | `RevisionBadge`, `Breadcrumb` |

---

## 체크리스트

- [ ] App.tsx가 30줄 이하인가?
- [ ] App.tsx의 모든 자식이 같은 추상화 수준(컴포넌트)인가?
- [ ] 각 컴포넌트가 자신의 표시 여부를 직접 결정하는가?
- [ ] Sidebar가 개별 패널의 비즈니스 로직을 알지 않는가?
