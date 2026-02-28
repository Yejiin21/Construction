import { OverlayControlBar } from '../viewer/OverlayControlBar';
import { DrawingCanvas } from '../viewer/DrawingCanvas';

export function DrawingViewer() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-100">
      <OverlayControlBar />
      <div className="flex-1 relative overflow-hidden">
        <DrawingCanvas />
      </div>
    </div>
  );
}
