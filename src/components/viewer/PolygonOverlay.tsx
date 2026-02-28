import { applyPolygonTransform } from '../../utils/transform';
import type { Polygon } from '../../types/drawing';

type PolygonOverlayProps = {
  polygon: Polygon;
  naturalWidth: number;
  naturalHeight: number;
  color?: string;
  strokeColor?: string;
};

export function PolygonOverlay({
  polygon,
  naturalWidth,
  naturalHeight,
  color = 'rgba(59,130,246,0.2)',
  strokeColor = 'rgb(59,130,246)',
}: PolygonOverlayProps) {
  const pts = applyPolygonTransform(polygon.vertices, polygon.polygonTransform);
  const pathD = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ') + ' Z';

  return (
    <svg
      viewBox={`0 0 ${naturalWidth} ${naturalHeight}`}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d={pathD} fill={color} stroke={strokeColor} strokeWidth="2" />
    </svg>
  );
}
