# 04. 렌더링 로직

## 두 가지 Transform 이해

데이터에는 **용도가 다른 두 가지 좌표 변환**이 존재한다.

| Transform | 용도 | 사용 위치 |
|-----------|------|---------|
| `imageTransform` | 두 이미지를 정렬(align). 기준 이미지 위에 오버레이 이미지를 올바르게 겹치기 위한 변환 | 공종 오버레이, region revision 표시 |
| `polygonTransform` | 폴리곤 꼭짓점 좌표를 이미지 위에 렌더링할 때 적용하는 좌표계 변환 | 건물 영역, 공종 영역 하이라이트 |

---

## 1. 좌표 변환 유틸 — transform.ts

```typescript
// src/utils/transform.ts

/**
 * imageTransform을 CSS transform으로 변환
 * 기준점(x, y)을 transformOrigin으로 설정하고 rotation + scale 적용
 */
export function getImageTransformStyle(transform: {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}): React.CSSProperties {
  return {
    transformOrigin: `${transform.x}px ${transform.y}px`,
    transform: `rotate(${transform.rotation}rad) scale(${transform.scale})`,
  };
}

/**
 * polygonTransform을 적용하여 vertices를 화면 좌표로 변환
 * 앵커 포인트(x, y)를 기준으로 rotation + scale 적용
 */
export function applyPolygonTransform(
  vertices: [number, number][],
  pt: { x: number; y: number; scale: number; rotation: number }
): [number, number][] {
  const cos = Math.cos(pt.rotation);
  const sin = Math.sin(pt.rotation);
  return vertices.map(([vx, vy]) => {
    const dx = vx - pt.x;
    const dy = vy - pt.y;
    return [
      pt.x + (dx * cos - dy * sin) * pt.scale,
      pt.y + (dx * sin + dy * cos) * pt.scale,
    ];
  });
}
```

---

## 2. DrawingCanvas — 도면 이미지 렌더링

```typescript
// src/components/viewer/DrawingCanvas.tsx
import { useRef } from 'react';
import { useDrawingStore } from '../../store/drawingStore';
import { useMetadata } from '../../hooks/useMetadata';
import { PolygonOverlay } from './PolygonOverlay';

export function DrawingCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { selectedDrawingId, selectedDiscipline, selectedRegion, selectedRevision } = useDrawingStore();
  const { data } = useMetadata();

  const drawing = data.drawings[selectedDrawingId];
  const discipline = drawing?.disciplines?.[selectedDiscipline ?? ''];

  // 현재 표시할 이미지와 polygon 결정
  const { imageUrl, polygon } = resolveCurrentView(drawing, discipline, selectedRegion, selectedRevision);

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-auto bg-gray-100">
      <div className="relative inline-block">
        <img src={imageUrl} alt="도면" className="max-w-none" />
        {polygon && (
          <PolygonOverlay
            polygon={polygon}
            className="absolute inset-0 pointer-events-none"
          />
        )}
      </div>
    </div>
  );
}
```

---

## 3. 특수 케이스 처리 — resolveCurrentView

도면 선택 상태에 따라 표시할 이미지와 polygon을 결정하는 로직.
이 로직이 복잡하므로 별도 함수로 분리한다.

```typescript
// src/utils/resolveCurrentView.ts
import type { Drawing, Discipline, Polygon } from '../types/drawing';

interface ViewResult {
  imageUrl: string;
  polygon: Polygon | undefined;
}

export function resolveCurrentView(
  drawing: Drawing | undefined,
  discipline: Discipline | undefined,
  selectedRegion: string | null,
  selectedRevision: string | null,
): ViewResult {
  // 케이스 1: 도면 없음 — 기본값
  if (!drawing) return { imageUrl: '/drawings/00_전체.png', polygon: undefined };

  // 케이스 2: 공종 미선택 — 도면 기본 이미지
  if (!discipline) {
    return { imageUrl: `/drawings/${drawing.image}`, polygon: undefined };
  }

  // 케이스 3: region이 있는 구조 공종 (101동 구조 A/B)
  if (discipline.regions && selectedRegion) {
    const region = discipline.regions[selectedRegion];
    const revision = region?.revisions.find((r) => r.version === selectedRevision)
      ?? region?.revisions.at(-1);
    return {
      imageUrl: `/drawings/${revision?.image ?? drawing.image}`,
      polygon: region?.polygon,
    };
  }

  // 케이스 4: revision별 polygon이 다른 경우 (주민공동시설 건축)
  // discipline에 imageTransform/polygon이 없고, 각 revision에 개별 polygon이 있음
  if (!discipline.imageTransform && !discipline.polygon) {
    const revision = discipline.revisions.find((r) => r.version === selectedRevision)
      ?? discipline.revisions.at(-1);
    return {
      imageUrl: `/drawings/${revision?.image ?? drawing.image}`,
      polygon: revision?.polygon,
    };
  }

  // 케이스 5: 일반 케이스 (polygon 없음 포함 — 주차장 구조)
  const revision = discipline.revisions.find((r) => r.version === selectedRevision)
    ?? discipline.revisions.at(-1);
  return {
    imageUrl: `/drawings/${revision?.image ?? drawing.image}`,
    polygon: discipline.polygon,  // undefined이면 PolygonOverlay 렌더링 안 됨
  };
}
```

---

## 4. PolygonOverlay — SVG 기반 영역 표시

```typescript
// src/components/viewer/PolygonOverlay.tsx
import { applyPolygonTransform } from '../../utils/transform';
import type { Polygon } from '../../types/drawing';

type PolygonOverlayProps = {
  polygon: Polygon;
  className?: string;
  color?: string;
  strokeColor?: string;
};

export function PolygonOverlay({
  polygon,
  className,
  color = 'rgba(59,130,246,0.2)',
  strokeColor = 'rgb(59,130,246)',
}: PolygonOverlayProps) {
  const pts = applyPolygonTransform(polygon.vertices, polygon.polygonTransform);
  const pathD = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + ' Z';

  return (
    <svg
      className={className}
      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={pathD} fill={color} stroke={strokeColor} strokeWidth="2" />
    </svg>
  );
}
```

---

## 5. ImageOverlay — 공종 이미지 겹쳐보기 (per-overlay opacity)

`overlayDisciplines`가 `OverlayDiscipline[]`으로 변경되어 공종별 opacity, revision을 독립 관리한다.

```typescript
// src/components/viewer/ImageOverlay.tsx
import { getImageTransformStyle } from '../../utils/transform';
import { useDrawingStore } from '../../store/drawingStore';
import { useMetadata } from '../../hooks/useMetadata';

export function ImageOverlay() {
  const { selectedDrawingId, overlayDisciplines } = useDrawingStore();
  const { data } = useMetadata();

  const drawing = data.drawings[selectedDrawingId];
  if (!drawing || overlayDisciplines.length === 0) return null;

  return (
    <>
      {overlayDisciplines.map(({ disciplineName, revision, opacity }) => {
        const discipline = drawing.disciplines?.[disciplineName];
        if (!discipline?.imageTransform) return null;

        const rev = discipline.revisions.find((r) => r.version === revision)
          ?? discipline.revisions.at(-1);
        if (!rev) return null;

        return (
          <img
            key={disciplineName}
            src={`/drawings/${rev.image}`}
            alt={`${disciplineName} 오버레이`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              ...getImageTransformStyle(discipline.imageTransform),
              mixBlendMode: 'multiply',
              opacity: opacity / 100,   // store: 0~100, CSS: 0~1
            }}
          />
        );
      })}
    </>
  );
}
```

---

## 6. Region 오버레이 — 중첩 CSS 컨테이너

**Region revision의 `imageTransform.relativeTo`는 건축이 아닌 구조 도면이다.**
행렬 합성 없이 중첩 컨테이너로 해결한다.

```
레이어 1 (base): 건축 도면
레이어 2: 구조 전체 (건축 위에 imageTransform 적용)
  └── 레이어 3: region A revision (구조 위에 imageTransform 적용)
        ← 브라우저가 두 transform을 자동 합성
```

```typescript
// src/components/viewer/RegionOverlay.tsx
export function RegionOverlay() {
  const { selectedDrawingId, overlayDisciplines } = useDrawingStore();
  const { data } = useMetadata();

  const drawing = data.drawings[selectedDrawingId];

  return (
    <>
      {overlayDisciplines.map(({ disciplineName, revision, opacity }) => {
        const discipline = drawing?.disciplines?.[disciplineName];
        if (!discipline?.regions || !discipline.imageTransform) return null;

        // 구조 전체 이미지를 건축 위에 배치 (레이어 2)
        return (
          <div
            key={disciplineName}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              ...getImageTransformStyle(discipline.imageTransform),
            }}
          >
            <img
              src={`/drawings/${discipline.image}`}
              alt={`${disciplineName} 전체`}
              style={{ opacity: opacity / 100, mixBlendMode: 'multiply' }}
            />

            {/* region revision을 구조 좌표계 위에 배치 (레이어 3) */}
            {Object.entries(discipline.regions).map(([regionKey, region]) => {
              const rev = region.revisions.find((r) => r.version === revision)
                ?? region.revisions.at(-1);
              if (!rev?.imageTransform) return null;

              return (
                <div
                  key={regionKey}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    ...getImageTransformStyle(rev.imageTransform),
                    // ← 구조 컨테이너 기준. 브라우저가 자동으로 건축 기준으로 합성
                  }}
                >
                  <img
                    src={`/drawings/${rev.image}`}
                    alt={`${disciplineName} ${regionKey}`}
                    style={{ opacity: opacity / 100, mixBlendMode: 'multiply' }}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </>
  );
}
```

---

## 7. OverlayControlBar — 투명도 조절 UI

슬라이더 대신 **숫자 직접 입력 + ▲▼ 버튼으로 1 단위 조절**.
오버레이가 하나라도 있을 때만 표시.

```typescript
// src/components/viewer/OverlayControlBar.tsx
export function OverlayControlBar() {
  const { overlayDisciplines, selectedDiscipline, baseOpacity,
          updateOverlayOpacity, setBaseOpacity, removeOverlay } = useDrawingStore();

  if (overlayDisciplines.length === 0) return null;

  return (
    <div className="absolute top-0 left-0 right-0 z-20 bg-white/90 border-b
                    px-4 py-2 flex items-center gap-4 text-sm">

      {/* base 공종 투명도 */}
      <OpacityControl
        label={`${selectedDiscipline} (기준)`}
        value={baseOpacity}
        onChange={setBaseOpacity}
      />

      {/* 오버레이 공종들 */}
      {overlayDisciplines.map(({ disciplineName, opacity }) => (
        <div key={disciplineName} className="flex items-center gap-2">
          <OpacityControl
            label={disciplineName}
            value={opacity}
            onChange={(v) => updateOverlayOpacity(disciplineName, v)}
          />
          <button
            onClick={() => removeOverlay(disciplineName)}
            className="text-gray-400 hover:text-gray-600"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// 숫자 입력 + ▲▼ 버튼 컨트롤
function OpacityControl({ label, value, onChange }: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-gray-600 shrink-0">{label}</span>
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-12 text-center border rounded text-xs py-0.5"
      />
      <div className="flex flex-col">
        <button
          onClick={() => onChange(value + 1)}
          className="text-xs leading-none px-1 hover:bg-gray-100 rounded"
        >▲</button>
        <button
          onClick={() => onChange(value - 1)}
          className="text-xs leading-none px-1 hover:bg-gray-100 rounded"
        >▼</button>
      </div>
    </div>
  );
}
```

---

## 6. 특수 케이스 정리

| 케이스 | 해당 도면 | 판별 방법 | 처리 |
|--------|----------|---------|------|
| region 있는 구조 공종 | 101동 구조 | `discipline.regions !== undefined` | RegionPanel 표시 → region 선택 → revision 선택 |
| revision별 polygon 다름 | 주민공동시설 건축 | `discipline.imageTransform === undefined && discipline.polygon === undefined` | 선택된 revision의 `revision.polygon` 사용 |
| polygon 없는 공종 | 주차장 구조 | `discipline.polygon === undefined` (일반 케이스) | PolygonOverlay 렌더링 생략, 이미지만 표시 |

---

## 체크리스트

- [ ] `resolveCurrentView`가 3가지 특수 케이스를 모두 처리하는가?
- [ ] `imageTransform`과 `polygonTransform`을 혼동하지 않았는가?
- [ ] polygon이 없는 경우 PolygonOverlay를 조건부로 렌더링하는가?
- [ ] 오버레이 이미지가 `imageTransform`의 `relativeTo` 기준으로 정렬되어 있는가?
- [ ] Region 오버레이에서 중첩 컨테이너를 사용해 변환 합성을 브라우저에 위임하는가?
- [ ] `ImageOverlay`가 `opacity / 100`으로 store 값(0~100)을 CSS 값(0~1)으로 변환하는가?
- [ ] `OverlayControlBar`가 슬라이더 대신 숫자 입력 + ▲▼ 버튼을 사용하는가?
