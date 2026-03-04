# 프로젝트명: construction

## 실행 방법

```bash
npm install
npm run dev
```

## 기술 스택

- React 19 + TypeScript
- Vite 7
- TailwindCSS
- Zustand 5

## 구현 기능

- [x] 공간 중심 트리 탐색 — 단지 → 동 → 공종 → Region A/B 계층 사이드바
- [x] 도면 이미지 표시 — 선택한 공종/리비전 도면을 캔버스에 렌더링
- [x] 현재 위치 Breadcrumb — 동 › 공종 › Region › 리비전 컨텍스트 표시
- [x] 최신 리비전 자동 선택 — 공종 클릭 시 가장 최근 리비전 자동 활성화
- [x] 리비전 타임라인 — 하단 바에 REV1 → REV2 흐름 표시, hover 시 날짜·설명·변경 내역 툴팁
- [x] 최신 리비전 변경 알림 — 변경 내역이 있는 공종에 파란 점 강조 표시
- [x] 관심 영역 폴리곤 오버레이 — 선택한 공종/리비전의 도면 내 영역을 SVG로 하이라이트
- [x] 공종 간 도면 겹쳐보기 — base 공종 선택 시 다른 공종 이미지를 imageTransform 기반으로 정렬·합성
- [x] 오버레이 투명도 독립 조절 — 기준 공종 및 각 오버레이 공종별 0~100 개별 제어
- [x] 구조 Region A/B 오버레이 — 중첩 CSS transform 컨테이너로 region→구조→건축 좌표계 합성
- [x] Region 오버레이 캘리브레이션 — 드래그 이동 + scale/rotation 미세 조정

## 미완성 기능

- [ ] 전체 배치도 polygon 클릭 탐색 — 배치도 위 건물 영역 클릭으로 해당 동 선택
- [ ] 리비전 간 변경 영역 시각적 diff — 리비전 이동 시 달라진 관심 영역 하이라이트
