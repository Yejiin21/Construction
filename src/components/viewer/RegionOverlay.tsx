/**
 * Region 있는 공종(구조 Region A/B) 오버레이 — 건축 base 위에
 * 구조 전체 → region 리비전 순으로 중첩 transform 적용.
 * calibration으로 회전/축소/확대/이동 조정. 드래그로 위치 이동 가능.
 */
import { useState, useCallback, useEffect } from 'react';
import { useDrawingStore } from '../../store/drawingStore';
import { useMetadata } from '../../hooks/useMetadata';

type RegionOverlayProps = {
  renderScale: number;
  /** 'visual': 이미지만 (pointer-events 없음). 'drag': 같은 위치에 드래그 핸들만. */
  mode?: 'visual' | 'drag';
};

type DragStart = {
  clientX: number;
  clientY: number;
  calX: number;
  calY: number;
};

export function RegionOverlay({ renderScale, mode = 'visual' }: RegionOverlayProps) {
  const { selectedDrawingId, overlayDisciplines, updateOverlayCalibration } =
    useDrawingStore();
  const { data } = useMetadata();

  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState<DragStart | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (draggingKey == null || dragStart == null || renderScale <= 0) return;
      const [disciplineName, region] = draggingKey.split(':');
      if (!region) return;
      updateOverlayCalibration(disciplineName, region, {
        x: dragStart.calX + (e.clientX - dragStart.clientX) / renderScale,
        y: dragStart.calY + (e.clientY - dragStart.clientY) / renderScale,
      });
    },
    [draggingKey, dragStart, renderScale, updateOverlayCalibration],
  );

  const handleMouseUp = useCallback(() => {
    setDraggingKey(null);
    setDragStart(null);
  }, []);

  useEffect(() => {
    if (draggingKey == null) return;
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [draggingKey, handleMouseMove, handleMouseUp]);

  const drawing = data.drawings[selectedDrawingId];
  if (!drawing) return null;

  const regionOverlays = overlayDisciplines.filter((o) => o.region != null);
  if (regionOverlays.length === 0) return null;

  const isVisual = mode === 'visual';
  const isDrag = mode === 'drag';

  return (
    <>
      {regionOverlays.map((overlay) => {
        const discipline = drawing.disciplines?.[overlay.disciplineName];
        if (!discipline?.regions || !discipline.imageTransform) return null;

        const region = discipline.regions[overlay.region!];
        if (!region) return null;

        const rev =
          region.revisions.find((r) => r.version === overlay.revision) ??
          region.revisions.at(-1);
        if (!rev?.imageTransform) return null;

        const overlayKey = `${overlay.disciplineName}:${overlay.region}`;
        const cal = overlay.calibration;
        const t1 = discipline.imageTransform;
        // 도면 영역에 맞추기: 컨테이너는 항상 오버레이와 동일 크기(1x), scale은 캘리브레이션만 적용
        const t2 = {
          x: rev.imageTransform.x + (cal?.x ?? 0),
          y: rev.imageTransform.y + (cal?.y ?? 0),
          scale: cal?.scale ?? 1,
          rotation: rev.imageTransform.rotation + (cal?.rotation ?? 0),
        };

        const baseStyle = {
          position: 'absolute' as const,
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
        };

        return (
          <div
            key={overlayKey}
            className="absolute inset-0"
            style={{
              ...baseStyle,
              transformOrigin: `${t1.x * renderScale}px ${t1.y * renderScale}px`,
              transform: `rotate(${t1.rotation}rad) scale(${t1.scale})`,
              pointerEvents: isDrag ? 'auto' : 'none',
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                ...baseStyle,
                transformOrigin: `${t2.x * renderScale}px ${t2.y * renderScale}px`,
                transform: `rotate(${t2.rotation}rad) scale(${t2.scale})`,
              }}
            >
              {isVisual && (
                <img
                  src={`/data/drawings/${rev.image}`}
                  alt={`${overlay.disciplineName} Region ${overlay.region}`}
                  draggable={false}
                  style={{
                    ...baseStyle,
                    objectFit: 'contain',
                    mixBlendMode: 'multiply',
                    opacity: overlay.opacity / 100,
                    pointerEvents: 'none',
                  }}
                />
              )}
              {isDrag && (
                <div
                  className="absolute inset-0 cursor-grab active:cursor-grabbing"
                  style={{ ...baseStyle, pointerEvents: 'auto' }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setDraggingKey(overlayKey);
                    setDragStart({
                      clientX: e.clientX,
                      clientY: e.clientY,
                      calX: cal?.x ?? 0,
                      calY: cal?.y ?? 0,
                    });
                  }}
                  role="presentation"
                />
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
