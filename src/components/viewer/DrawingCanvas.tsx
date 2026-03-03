import { useRef, useState, useEffect } from 'react';
import { useDrawingStore } from '../../store/drawingStore';
import { useMetadata } from '../../hooks/useMetadata';
import { ImageOverlay } from './ImageOverlay';
import { RegionOverlay } from './RegionOverlay';
import { resolveCurrentView } from '../../utils/resolveCurrentView';

export function DrawingCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null);

  const {
    selectedDrawingId,
    selectedDiscipline,
    selectedRegion,
    selectedRevision,
    isOverlayMode,
    baseOpacity,
  } = useDrawingStore();
  const { state } = useMetadata();

  // 컨테이너 크기 추적
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerSize({ w: width, h: height });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // object-contain 렌더 영역 계산
  let imageRect: { left: number; top: number; width: number; height: number } | null = null;
  let renderScale = 1;
  if (naturalSize && containerSize) {
    renderScale = Math.min(containerSize.w / naturalSize.w, containerSize.h / naturalSize.h);
    const w = naturalSize.w * renderScale;
    const h = naturalSize.h * renderScale;
    imageRect = {
      left: (containerSize.w - w) / 2,
      top: (containerSize.h - h) / 2,
      width: w,
      height: h,
    };
  }

  let content: React.ReactNode;

  if (state.status === 'loading') {
    content = (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        불러오는 중...
      </div>
    );
  } else if (state.status === 'error') {
    content = (
      <div className="flex items-center justify-center h-full text-red-400 text-sm">
        데이터 오류
      </div>
    );
  } else {
    const { data } = state;
    const drawing = data.drawings[selectedDrawingId];
    const discipline = drawing?.disciplines?.[selectedDiscipline ?? ''];
    const { imageUrl } = resolveCurrentView(drawing, discipline, selectedRegion, selectedRevision);

    content = (
      <>
        {/* 기준 도면 이미지 */}
        <img
          key={imageUrl}
          src={imageUrl}
          alt="도면"
          className="w-full h-full object-contain"
          style={isOverlayMode ? { opacity: baseOpacity / 100 } : undefined}
          onLoad={(e) => {
            const img = e.currentTarget;
            setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
          }}
        />
        {/* 공종 이미지 오버레이 (비교 모드) — 시각만, 클릭은 통과 */}
        {isOverlayMode && imageRect && naturalSize && (
          <>
            <div
              className="pointer-events-none"
              style={{
                position: 'absolute',
                left: imageRect.left,
                top: imageRect.top,
                width: imageRect.width,
                height: imageRect.height,
              }}
            >
              <ImageOverlay renderScale={renderScale} />
              <RegionOverlay renderScale={renderScale} mode="visual" />
            </div>
            {/* Region 드래그 핸들 전용 레이어 — 여기만 클릭/드래그 가능 */}
            <div
              className="pointer-events-auto"
              style={{
                position: 'absolute',
                left: imageRect.left,
                top: imageRect.top,
                width: imageRect.width,
                height: imageRect.height,
              }}
            >
              <RegionOverlay renderScale={renderScale} mode="drag" />
            </div>
          </>
        )}
      </>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full overflow-hidden bg-gray-100">
      {content}
    </div>
  );
}
