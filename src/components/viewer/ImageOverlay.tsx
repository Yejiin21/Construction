import { useDrawingStore } from '../../store/drawingStore';
import { useMetadata } from '../../hooks/useMetadata';

type Props = {
  renderScale: number;
};

export function ImageOverlay({ renderScale }: Props) {
  const { selectedDrawingId, overlayDisciplines } = useDrawingStore();
  const { state } = useMetadata();

  if (state.status !== 'success' || overlayDisciplines.length === 0) return null;

  const drawing = state.data.drawings[selectedDrawingId];
  if (!drawing) return null;

  // region 있는 공종(구조 Region A/B)은 RegionOverlay에서 처리
  const nonRegionOverlays = overlayDisciplines.filter((o) => o.region == null);
  if (nonRegionOverlays.length === 0) return null;

  return (
    <>
      {nonRegionOverlays.map(({ disciplineName, revision, opacity }) => {
        const discipline = drawing.disciplines?.[disciplineName];
        if (!discipline?.imageTransform) return null;

        // revision이 없는 공종(구조 등)은 discipline.image 직접 사용
        const revImage = discipline.revisions?.length
          ? (discipline.revisions.find((r) => r.version === revision) ?? discipline.revisions.at(-1))?.image
          : discipline.image;
        if (!revImage) return null;

        const { x, y, scale, rotation } = discipline.imageTransform;

        return (
          <img
            key={disciplineName}
            src={`/data/drawings/${revImage}`}
            alt={`${disciplineName} 오버레이`}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              transformOrigin: `${x * renderScale}px ${y * renderScale}px`,
              transform: `rotate(${rotation}rad) scale(${scale})`,
              mixBlendMode: 'multiply',
              opacity: opacity / 100,
            }}
          />
        );
      })}
    </>
  );
}
