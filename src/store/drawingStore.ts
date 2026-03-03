import { create } from "zustand";

// 오버레이 공종별 독립 설정 (region 있으면 Region A/B 구분, calibration으로 회전/축소/확대 조정)
export interface OverlayCalibration {
  x: number;
  y: number;
  scale: number;
  rotation: number;
}

interface OverlayDiscipline {
  disciplineName: string; // '구조', '설비' 등
  revision: string; // 선택된 revision version
  opacity: number; // 0~100
  region?: string; // region 있는 공종(구조)일 때 'A' | 'B'
  calibration?: OverlayCalibration; // region 오버레이만: 메타데이터 transform에 더할 delta
}

interface DrawingState {
  selectedDrawingId: string;
  selectedDiscipline: string | null;
  selectedRegion: string | null;
  selectedRevision: string | null;
  isOverlayMode: boolean; // '비교하기' 버튼으로 진입
  overlayDisciplines: OverlayDiscipline[]; // 공종별 독립 설정
  baseOpacity: number; // base 공종 투명도 (0~100)

  selectDrawing: (id: string) => void;
  selectDiscipline: (discipline: string | null) => void;
  selectRegion: (region: string | null) => void;
  selectRevision: (version: string | null) => void;
  enterOverlayMode: () => void;
  exitOverlayMode: () => void;
  addOverlay: (disciplineName: string, revision: string, region?: string) => void;
  removeOverlay: (disciplineName: string, region?: string) => void;
  updateOverlayOpacity: (disciplineName: string, opacity: number, region?: string) => void;
  updateOverlayCalibration: (
    disciplineName: string,
    region: string,
    calibration: Partial<OverlayCalibration>,
  ) => void;
  setBaseOpacity: (opacity: number) => void;
}

export const useDrawingStore = create<DrawingState>((set) => ({
  selectedDrawingId: "00",
  selectedDiscipline: null,
  selectedRegion: null,
  selectedRevision: null,
  isOverlayMode: false,
  overlayDisciplines: [],
  baseOpacity: 100,

  // 동이 바뀌면 하위 상태 전체 초기화 — 연쇄 초기화는 store action 한 곳에서만 처리
  selectDrawing: (id) =>
    set({
      selectedDrawingId: id,
      selectedDiscipline: null,
      selectedRegion: null,
      selectedRevision: null,
      isOverlayMode: false,
      overlayDisciplines: [],
      baseOpacity: 100,
    }),

  // 공종 비교 중 다른 공종 선택 시 자동 비교 종료 → 해당 공종만 표시
  selectDiscipline: (discipline) =>
    set((s) => {
      const exitOverlay = s.isOverlayMode
        ? { isOverlayMode: false as const, overlayDisciplines: [] as OverlayDiscipline[], baseOpacity: 100 }
        : {};
      return {
        selectedDiscipline: discipline,
        selectedRegion: null,
        selectedRevision: null,
        ...exitOverlay,
      };
    }),

  selectRegion: (region) =>
    set({ selectedRegion: region, selectedRevision: null }),

  selectRevision: (version) => set({ selectedRevision: version }),

  enterOverlayMode: () => set({ isOverlayMode: true }),

  // 모드 종료 + overlay 초기화를 한 번에 처리 (나갔다 돌아와도 이전 설정 잔존 방지)
  exitOverlayMode: () =>
    set({ isOverlayMode: false, overlayDisciplines: [], baseOpacity: 100 }),

  // 오버레이 추가 시 기본 opacity 70, 최신 revision·region은 호출부에서 전달
  addOverlay: (disciplineName, revision, region) =>
    set((s) => {
      const exists = s.overlayDisciplines.some(
        (o) =>
          o.disciplineName === disciplineName &&
          (o.region ?? '') === (region ?? ''),
      );
      if (exists) return s;
      return {
        overlayDisciplines: [
          ...s.overlayDisciplines,
          { disciplineName, revision, opacity: 70, region },
        ],
      };
    }),

  removeOverlay: (disciplineName, region) =>
    set((s) => ({
      overlayDisciplines: s.overlayDisciplines.filter(
        (o) =>
          !(o.disciplineName === disciplineName && (o.region ?? '') === (region ?? '')),
      ),
    })),

  updateOverlayOpacity: (disciplineName, opacity, region?) =>
    set((s) => ({
      overlayDisciplines: s.overlayDisciplines.map((o) =>
        o.disciplineName === disciplineName && (region == null || o.region === region)
          ? { ...o, opacity: Math.max(0, Math.min(100, opacity)) }
          : o,
      ),
    })),

  updateOverlayCalibration: (disciplineName, region, calibration) =>
    set((s) => ({
      overlayDisciplines: s.overlayDisciplines.map((o) =>
        o.disciplineName === disciplineName && o.region === region
          ? {
              ...o,
              calibration: {
                x: o.calibration?.x ?? 0,
                y: o.calibration?.y ?? 0,
                scale: o.calibration?.scale ?? 1,
                rotation: o.calibration?.rotation ?? 0,
                ...calibration,
              },
            }
          : o,
      ),
    })),

  setBaseOpacity: (opacity) =>
    set({ baseOpacity: Math.max(0, Math.min(100, opacity)) }),
}));
