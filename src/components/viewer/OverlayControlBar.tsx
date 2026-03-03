import {
  useDrawingStore,
  type OverlayCalibration,
} from "../../store/drawingStore";
import { useMetadata } from "../../hooks/useMetadata";

const CAL_SCALE_STEP = 0.05;
const CAL_ROTATION_STEP = (5 * Math.PI) / 180;

type OverlayOption = {
  disciplineName: string;
  region?: string;
  label: string;
  revision: string;
};

export function OverlayControlBar() {
  const {
    selectedDrawingId,
    selectedDiscipline,
    isOverlayMode,
    overlayDisciplines,
    baseOpacity,
    addOverlay,
    removeOverlay,
    updateOverlayOpacity,
    updateOverlayCalibration,
    setBaseOpacity,
    exitOverlayMode,
  } = useDrawingStore();
  const { state } = useMetadata();

  if (!isOverlayMode || state.status !== "success") return null;

  const drawing = state.data.drawings[selectedDrawingId];
  const disciplines = drawing?.disciplines ?? {};

  // 오버레이 옵션 목록: region 있으면 Region A/B 각각, 없으면 공종 하나
  const overlayOptions: OverlayOption[] = [];
  for (const [name, d] of Object.entries(disciplines)) {
    if (name === selectedDiscipline) continue;
    if (!d.imageTransform && !d.image) continue;
    if (d.regions) {
      for (const regionKey of Object.keys(d.regions)) {
        const region = d.regions[regionKey];
        const latestRev = region.revisions?.at(-1);
        if (latestRev) {
          overlayOptions.push({
            disciplineName: name,
            region: regionKey,
            label: `${name} (Region ${regionKey})`,
            revision: latestRev.version,
          });
        }
      }
    } else if (d.image || (d.revisions?.length ?? 0) > 0) {
      const latestRev = d.revisions?.at(-1)?.version ?? "";
      overlayOptions.push({
        disciplineName: name,
        label: name,
        revision: latestRev,
      });
    }
  }

  function isActive(opt: OverlayOption) {
    return overlayDisciplines.some(
      (o) =>
        o.disciplineName === opt.disciplineName &&
        (o.region ?? "") === (opt.region ?? ""),
    );
  }

  function getOverlay(opt: OverlayOption) {
    return overlayDisciplines.find(
      (o) =>
        o.disciplineName === opt.disciplineName &&
        (o.region ?? "") === (opt.region ?? ""),
    );
  }

  return (
    <div className="border-b bg-white px-4 py-2 flex items-center gap-4 text-sm shrink-0 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500 shrink-0">
          {selectedDiscipline} (기준)
        </span>
        <OpacityControl value={baseOpacity} onChange={setBaseOpacity} />
      </div>

      <span className="text-gray-200 text-xs">|</span>

      {overlayOptions.map((opt) => {
        const active = isActive(opt);
        const overlay = getOverlay(opt);
        return (
          <div key={opt.region ? `${opt.disciplineName}-${opt.region}` : opt.disciplineName} className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() =>
                active
                  ? removeOverlay(opt.disciplineName, opt.region)
                  : addOverlay(opt.disciplineName, opt.revision, opt.region)
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                active
                  ? "bg-blue-50 border-blue-300 text-blue-700"
                  : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${active ? "bg-blue-500" : "bg-gray-300"}`}
              />
              {opt.label}
            </button>
            {active && overlay && (
              <>
                <OpacityControl
                  value={overlay.opacity}
                  onChange={(v) =>
                    updateOverlayOpacity(opt.disciplineName, v, opt.region)
                  }
                />
                {opt.region != null && (
                  <CalibrationControls
                    calibration={overlay.calibration}
                    onUpdate={(delta) =>
                      updateOverlayCalibration(
                        opt.disciplineName,
                        opt.region!,
                        delta,
                      )
                    }
                  />
                )}
              </>
            )}
          </div>
        );
      })}

      <button
        onClick={exitOverlayMode}
        className="ml-auto text-xs text-gray-400 hover:text-gray-600 shrink-0"
      >
        ✕ 비교 종료
      </button>
    </div>
  );
}

function OpacityControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-10 text-center border rounded text-xs py-0.5 text-gray-600"
      />
      <div className="flex flex-col">
        <button
          onClick={() => onChange(value + 1)}
          className="text-[10px] leading-none px-0.5 hover:bg-gray-100 rounded text-gray-500"
        >
          ▲
        </button>
        <button
          onClick={() => onChange(value - 1)}
          className="text-[10px] leading-none px-0.5 hover:bg-gray-100 rounded text-gray-500"
        >
          ▼
        </button>
      </div>
    </div>
  );
}

type CalibrationControlsProps = {
  calibration: OverlayCalibration | undefined;
  onUpdate: (delta: Partial<OverlayCalibration>) => void;
};

function CalibrationControls({
  calibration,
  onUpdate,
}: CalibrationControlsProps) {
  const scale = calibration?.scale ?? 1;
  const rotation = calibration?.rotation ?? 0;

  return (
    <div className="flex items-center gap-2 pl-2 border-l border-gray-200 text-xs text-gray-500">
      <span>캘리브레이션:</span>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onUpdate({ scale: scale - CAL_SCALE_STEP })}
          className="px-1.5 py-0.5 border rounded hover:bg-gray-100"
        >
          −
        </button>
        <span className="w-8 text-center">{scale.toFixed(2)}</span>
        <button
          type="button"
          onClick={() => onUpdate({ scale: scale + CAL_SCALE_STEP })}
          className="px-1.5 py-0.5 border rounded hover:bg-gray-100"
        >
          +
        </button>
      </div>
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={() => onUpdate({ rotation: rotation - CAL_ROTATION_STEP })}
          className="px-1.5 py-0.5 border rounded hover:bg-gray-100"
        >
          ↺
        </button>
        <span className="w-10 text-center">
          {((rotation * 180) / Math.PI).toFixed(0)}°
        </span>
        <button
          type="button"
          onClick={() => onUpdate({ rotation: rotation + CAL_ROTATION_STEP })}
          className="px-1.5 py-0.5 border rounded hover:bg-gray-100"
        >
          ↻
        </button>
      </div>
    </div>
  );
}
