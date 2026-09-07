# ATLAS — 3D Worldbuilding Archive

한 화면의 3D 지도에서 지역을 탐험하고 인물의 이야기를 읽는 세계관 아카이브.

## 실행 및 검증

Node.js 22 이상. 외부 npm 패키지 설치 없이 실행됩니다.

```sh
npm run dev
npm test
npm run build
```

로컬 주소: http://127.0.0.1:4173 — 배포 결과는 `dist/`.
3D 뷰어와 글꼴은 CDN을 사용하므로 인터넷 연결이 필요합니다.

## 화면과 조작

- **World:** 드래그 회전, 스크롤/핀치 확대, 지역 핀 또는 하단 지역 버튼으로 이동.
- **Region:** 해당 지역만의 환경 모델과 설정, 그 지역에 소속된 인물 목록.
- **Character:** 인물 설정과 전용 모델. 아직 제공되지 않은 모델은 준비 중으로 표시.
- World로 돌아가면 탭 안에 저장된 마지막 지도 시점이 복원됩니다.
- 자동 회전은 사용하지 않으며, 시스템의 동작 줄이기 설정을 존중합니다.
- 잘못된 지역/인물 URL은 안내와 함께 유효한 첫 기록으로 정규화합니다.

## 콘텐츠 교체

`src/content.js`에서 지역 설정, 소속 인물, 모델 경로, 지도 좌표(`position`), 접근 카메라(`view`)를 관리합니다.

- 월드 지도: `src/assets/demo-world.glb`
- 지역 환경: `src/assets/region-grove.glb`, `region-citadel.glb`, `region-ashen.glb`
- 캐릭터: 본인의 GLB를 `src/assets/`에 넣고 해당 인물의 `model: null`을 `"./assets/이름.glb"`로 변경
- 모델 파일은 공백 없는 영문/숫자/하이픈 이름을 사용하세요.
- FBX는 제작 원본으로 보관하고 웹용 GLB로 변환하여 넣으세요.

현재 지형은 기존 ATLAS 데모 지도에서 지역별로 분리한 임시 모델입니다. 캐릭터 원본은 아직 제공되지 않았습니다. 샘플 로봇은 제거했습니다.

빌드는 콘텐츠 연결과 모델 존재 여부를 검사하며 **모델을 재생성하거나 덮어쓰지 않습니다.**
`npm run demo:regions`는 기존 데모의 지역 추출 도구이며, 대상 파일이 있으면 덮어쓰지 않고 중단합니다.

## 구조

- `src/navigation.js`: 경로 해석, 선택 지역, 지도 시점 저장
- `src/scene.js`: 공통 모델 로딩/실패/재시도/빈 상태
- `src/script.js`: 월드 조작 및 지역 이동
- `src/region.js`, `src/character.js`: 각각의 상세 기록
- `src/explorer.css`: 지도 중심 레이아웃과 모바일/접근성 개선
- `validate.mjs`, `tests/`: 배포 전 콘텐츠 및 회귀 검사

`.openai/hosting.json`은 기존 Sites 프로젝트 연결 정보입니다. 인증 토큰이나 비밀 값은 저장소에 넣지 않습니다.
