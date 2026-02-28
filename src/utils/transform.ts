import type React from 'react';

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
