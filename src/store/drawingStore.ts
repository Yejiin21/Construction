import { create } from 'zustand';

// 오버레이 공종별 독립 설정 (단순 string[] 대신 — revision·opacity를 공종마다 따로 제어)
interface OverlayDiscipline {
  disciplineName: string; // '구조', '설비' 등
  revision: string;       // 선택된 revision version
  opacity: number;        // 0~100
}

interface DrawingState {
  selectedDrawingId: string;
  selectedDiscipline: string | null;
  selectedRegion: string | null;
  selectedRevision: string | null;
  isOverlayMode: boolean;                  // '비교하기' 버튼으로 진입
  overlayDisciplines: OverlayDiscipline[]; // 공종별 독립 설정
  baseOpacity: number;                     // base 공종 투명도 (0~100)

  selectDrawing: (id: string) => void;
  selectDiscipline: (discipline: string | null) => void;
  selectRegion: (region: string | null) => void;
  selectRevision: (version: string | null) => void;
  enterOverlayMode: () => void;
  exitOverlayMode: () => void;
  addOverlay: (disciplineName: string, revision: string) => void;
  removeOverlay: (disciplineName: string) => void;
  updateOverlayOpacity: (disciplineName: string, opacity: number) => void;
  updateOverlayRevision: (disciplineName: string, revision: string) => void;
  setBaseOpacity: (opacity: number) => void;
}

export const useDrawingStore = create<DrawingState>((set) => ({
  selectedDrawingId: '00',
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

  selectDiscipline: (discipline) =>
    set({ selectedDiscipline: discipline, selectedRegion: null, selectedRevision: null }),

  selectRegion: (region) =>
    set({ selectedRegion: region, selectedRevision: null }),

  selectRevision: (version) =>
    set({ selectedRevision: version }),

  enterOverlayMode: () => set({ isOverlayMode: true }),

  // 모드 종료 + overlay 초기화를 한 번에 처리 (나갔다 돌아와도 이전 설정 잔존 방지)
  exitOverlayMode: () =>
    set({ isOverlayMode: false, overlayDisciplines: [], baseOpacity: 100 }),

  // 오버레이 추가 시 기본 opacity 70, 최신 revision은 호출부에서 전달
  addOverlay: (disciplineName, revision) =>
    set((s) => ({
      overlayDisciplines: s.overlayDisciplines.some((o) => o.disciplineName === disciplineName)
        ? s.overlayDisciplines
        : [...s.overlayDisciplines, { disciplineName, revision, opacity: 70 }],
    })),

  removeOverlay: (disciplineName) =>
    set((s) => ({
      overlayDisciplines: s.overlayDisciplines.filter((o) => o.disciplineName !== disciplineName),
    })),

  updateOverlayOpacity: (disciplineName, opacity) =>
    set((s) => ({
      overlayDisciplines: s.overlayDisciplines.map((o) =>
        o.disciplineName === disciplineName
          ? { ...o, opacity: Math.max(0, Math.min(100, opacity)) }
          : o
      ),
    })),

  updateOverlayRevision: (disciplineName, revision) =>
    set((s) => ({
      overlayDisciplines: s.overlayDisciplines.map((o) =>
        o.disciplineName === disciplineName ? { ...o, revision } : o
      ),
    })),

  setBaseOpacity: (opacity) =>
    set({ baseOpacity: Math.max(0, Math.min(100, opacity)) }),
}));
