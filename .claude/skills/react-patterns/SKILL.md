---
name: react-pattern
description: 건설 도면 탐색 인터페이스 구현을 위한 React 18+ + TypeScript + TailwindCSS 패턴 가이드. 건설 도면(메타데이터 기반), 공종 필터, 리비전 히스토리, 이미지 오버레이 기능을 구현할 때 반드시 이 스킬을 참고할 것. drawing navigation, 도면 탐색, 리비전, 공종, imageTransform, overlay 등의 키워드가 나오면 이 스킬을 사용할 것.
---

# 건설 도면 탐색 인터페이스 — React Pattern Guide

## 프로젝트 개요

샘플 아파트 단지의 건설 도면 탐색 인터페이스 구현 과제.
현장 소장이 수백 장의 도면 속에서 원하는 도면을 빠르게 찾고, 리비전을 추적하고, 공종 간 도면을 겹쳐 볼 수 있는 UX를 제공해야 한다.

### 데이터 계층 구조

```
전체 배치도 (00)
├── 101동 (01)
│   ├── 건축       → REV1
│   ├── 공조설비    → REV1
│   ├── 구조
│   │   ├── Region A → REV1A, REV2A
│   │   └── Region B → REV1B, REV2B
│   ├── 배관설비    → REV1
│   └── 소방       → REV1
├── 주민공동시설 (09)
│   ├── 건축       → REV1, REV2, REV3  ← revision마다 별도 polygon/imageTransform
│   ├── 구조       → REV1
│   ├── 설비       → REV1
│   └── 소방       → REV1
└── 주차장 (13)
    ├── 구조       → REV1  ← 기준 도면 자체 (polygon 없음)
    ├── 소방       → REV1
    ├── 설비       → REV1
    └── 조경       → REV1
```

---

## 기술 스택

- **React 18+** + **TypeScript**
- **TailwindCSS** (스타일링)
- **Zustand** (전역 상태관리) — 단순하고 보일러플레이트 없음
- **Vite** (빌드 도구)
- 추가 라이브러리 없음 (SVG 오버레이는 직접 구현)

### 프로젝트 초기화

```bash
npm create vite@latest . -- --template react-ts
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
npm install zustand
```

---

## 개발 원칙

### 철학: 다른 사람의 시간을 줄여주자

> **클린 코드는 짧은 코드가 아닙니다. 원하는 로직을 빠르게 찾을 수 있는 코드입니다.**

모든 코드 결정의 기준은 **이해 시간**이다. 현장 소장이 도면을 찾듯, 코드를 읽는 사람도 원하는 로직에 빠르게 도달할 수 있어야 한다.

### 핵심 원칙 요약

| 원칙 | 이 프로젝트에서의 적용 |
|------|-----------------------|
| **응집도** | 핵심 데이터(공종명, 선택 상태)는 props로 드러내고, 세부 구현(imageTransform 계산)은 훅/유틸로 숨기기 |
| **단일 책임** | `selectDrawing` action은 하위 상태 초기화까지 포함. store를 읽으면 파악 가능 |
| **추상화 수준 통일** | App.tsx는 컴포넌트 조합만. 마크업/로직이 섞이지 않게 |
| **수렴 방지** | 탐색 상태만 Zustand. 줌/hover 등 로컬 UI 상태는 useState |

---

## UX 탐색 흐름

```
전체 배치도 → 동 선택 → 공종 선택
                              ↓
                    region 있음? → Region A/B 선택
                              ↓
                    리비전 선택 (최신이 기본값)
                              ↓
                    도면 표시 + 리비전 타임라인
```

### 사용자 시나리오별 핵심 기능

| 시나리오 | 핵심 기능 |
|----------|---------|
| 아침 회의 전 — 최신 현황 파악 | 공종 선택 시 최신 리비전 자동 선택 + "최신" 배지 표시 |
| 현장 체크 — 공종 간 간섭 확인 | 오버레이 모드: 여러 공종 이미지를 imageTransform으로 겹쳐보기 |
| 오후 미팅 — 리비전 변경 이력 추적 | RevisionTimeline: REV1→REV2→REV3 타임라인 + changes 변경 내역 표시 |

---

## 레퍼런스 파일

상세한 코드 예시, 안티패턴, 체크리스트는 아래 파일을 참고한다.

| 파일 | 내용 |
|------|------|
| [01-layout-structure.md](references/01-layout-structure.md) | App.tsx 레이아웃 조합, 추상화 수준 통일, 파일 디렉토리 구조, 컴포넌트 명명 규칙 |
| [02-component-patterns.md](references/02-component-patterns.md) | Props 구분 원칙, DisciplinePanel/RegionPanel/RevisionTimeline 패턴, 분리 판단 기준, 수렴 방지 |
| [03-state-management.md](references/03-state-management.md) | Zustand 스토어 전체 코드, Zustand vs useState 판단 기준, useMetadata 훅, 상태 초기화 패턴 |
| [04-rendering.md](references/04-rendering.md) | imageTransform/polygonTransform 변환, DrawingCanvas, PolygonOverlay, ImageOverlay, 특수 케이스 처리 |
| [05-data-types.md](references/05-data-types.md) | 전체 TypeScript 타입 정의, relativeTo 매핑, 특수 케이스별 데이터 구조, 데이터 파일 접근 설정 |

---

## 구현 체크리스트

- [ ] TypeScript 타입 정의 완료 → `references/05-data-types.md`
- [ ] Zustand 스토어 셋업 → `references/03-state-management.md`
- [ ] App.tsx + Sidebar + DrawingViewer 레이아웃 → `references/01-layout-structure.md`
- [ ] BuildingList → 전체 배치도 동 탐색
- [ ] DisciplinePanel → 공종 선택 + 최신 리비전 자동 선택
- [ ] RegionPanel → 구조 공종 A/B 선택 (자신의 표시 여부 직접 결정)
- [ ] RevisionTimeline → 리비전 히스토리 + changes 표시
- [ ] DrawingCanvas + PolygonOverlay → 도면 + 영역 렌더링 → `references/04-rendering.md`
- [ ] 특수 케이스 처리 (region / revision별 polygon / polygon 없음)
- [ ] Breadcrumb → 현재 컨텍스트 표시
- [ ] ImageOverlay → 공종 겹쳐보기 오버레이 모드
