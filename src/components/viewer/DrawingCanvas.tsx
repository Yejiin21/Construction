import { useRef, useState, useEffect } from 'react';
import { useDrawingStore } from '../../store/drawingStore';
import { useMetadata } from '../../hooks/useMetadata';
import { PolygonOverlay } from './PolygonOverlay';
import { resolveCurrentView } from '../../utils/resolveCurrentView';

export function DrawingCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [containerSize, setContainerSize] = useState<{ w: number; h: number } | null>(null);

  const { selectedDrawingId, selectedDiscipline, selectedRegion, selectedRevision } = useDrawingStore();
  const { state } = useMetadata();

  // 컨테이너 크기 추적 — ResizeObserver로 리사이즈 시에도 정확한 크기 유지
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

  // object-contain 렌더 영역 계산 (이미지 실제 위치 + 크기)
  let imageRect: { left: number; top: number; width: number; height: number } | null = null;
  if (naturalSize && containerSize) {
    const scale = Math.min(containerSize.w / naturalSize.w, containerSize.h / naturalSize.h);
    const w = naturalSize.w * scale;
    const h = naturalSize.h * scale;
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
    const { imageUrl, polygon } = resolveCurrentView(drawing, discipline, selectedRegion, selectedRevision);

    content = (
      <>
        <img
          key={imageUrl}
          src={imageUrl}
          alt="도면"
          className="w-full h-full object-contain"
          onLoad={(e) => {
            const img = e.currentTarget;
            setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
          }}
        />
        {/* 폴리곤 오버레이: 이미지 실제 렌더 영역에만 정확히 겹침 */}
        {polygon && imageRect && naturalSize && (
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
            <PolygonOverlay
              polygon={polygon}
              naturalWidth={naturalSize.w}
              naturalHeight={naturalSize.h}
            />
          </div>
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
