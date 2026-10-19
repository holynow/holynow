# 목장노트 ⛪

매주 손으로 쓰던 **목장 보고서**를 목원들과 함께 쓰고 나누는 모바일 웹앱입니다.
휴대폰 홈 화면에 추가하면 앱처럼 쓸 수 있어요 (PWA).

## 기능

| 기능 | 설명 |
| --- | --- |
| 📝 목장 보고서 | 모임 날짜별로 목원마다 **기도제목**, **경건생활**(성경 읽은 장 수, 새벽기도 횟수, 큐티, 하루 기도 시간), 출석을 기록. 목원들이 실시간으로 함께 보고, 자기 기록은 직접 작성 |
| 🎤 음성 기도제목 | 기도제목, 모임 나눔 기록, 설교 필기를 말로 받아쓰기 |
| 📷 주보 AI 분석 | 주보 사진(최대 4장)을 찍으면 설교 제목·본문·요약·주보 질문을 정리하고, **목장 나눔 가이드**(중심 주제, 추천 질문과 의도, 삶의 적용)를 제안 |
| 🙏 대표기도문 | 목원들의 기도제목(+이번 주 말씀)으로 대표기도문 생성. 길이 선택, 수정·공유 가능 |
| 📖 음성 성경 찾기 | “요한복음 3장 16절”, “고린도전서 십삼장 사절에서 칠절” 처럼 말하면 본문을 바로 표시 (개역한글). 규칙 기반 파서가 못 알아들으면 AI가 한 번 더 해석 |
| ✏️ 예배 노트 | 찾은 구절에 메모하고, 설교를 필기하는 개인 노트 (자동 저장) |
| 📤 공유 | 보고서를 카카오톡에 붙여넣기 좋은 텍스트로 공유, 초대 링크로 목원 초대 |

## 구조

```
app/
├── api/                 # Vercel 서버 함수 (Claude API 키는 서버에만 있음)
│   ├── analyze-bulletin.ts   주보 사진 분석
│   ├── prayer.ts             대표기도문 생성
│   ├── parse-reference.ts    음성 구절 해석 (AI 보조)
│   └── bible.ts              성경 본문 (개역한글)
├── shared/              # 서버·앱 공용 (성경 66권 표, 구절 파서, 타입)
├── src/                 # React + TypeScript + styled-components
│   ├── data/            # 저장소: Firebase(공유) 또는 로컬 데모 모드
│   ├── pages/
│   └── ui/
└── firestore.rules      # 목장 구성원만 읽고 쓰도록 하는 보안 규칙
```

## 바로 실행해 보기 (데모 모드)

```bash
cd app
npm install
cp .env.example .env     # ANTHROPIC_API_KEY만 넣으면 AI 기능까지 동작
npm run dev
```

Firebase 설정이 비어 있으면 **데모 모드**로 실행돼요. 기록이 그 브라우저에만 저장되므로 혼자 써보기에 좋습니다.

## 목원들과 공유하려면 (Firebase)

1. [Firebase 콘솔](https://console.firebase.google.com)에서 프로젝트 생성
2. **Authentication** → 로그인 방법 → **Google** 사용 설정
3. **Firestore Database** 생성 → 규칙 탭에 `firestore.rules` 내용 붙여넣고 게시
4. 프로젝트 설정 → 웹 앱 추가 → 나오는 값을 `.env`의 `VITE_FIREBASE_*`에 입력
5. 서버용 `FIREBASE_PROJECT_ID`도 같은 프로젝트 ID로 설정 (로그인한 사람만 AI 기능 사용 → API 비용 보호)

## 배포 (Vercel)

1. Vercel에서 이 저장소를 Import, **Root Directory를 `app`** 으로 지정 (프레임워크: Vite)
2. Environment Variables에 `.env.example`의 값들을 입력
3. 배포 후 Firebase Authentication → 설정 → **승인된 도메인**에 Vercel 도메인 추가

## 개발

```bash
npm test          # 구절 파서 등 단위 테스트
npm run typecheck
npm run build
```

### 참고

- AI 기능은 Claude API(`claude-opus-5-5`)를 사용합니다. 모델은 `CLAUDE_MODEL` 환경변수로 바꿀 수 있어요.
- 성경 본문은 저작권이 만료된 **개역한글**을 공개 API(bolls.life, 실패 시 getbible.net)에서 가져옵니다. 개역개정은 대한성서공회 저작권이라 사용하지 않았습니다.
- 음성 인식은 브라우저 기능(Web Speech API)을 씁니다. Android Chrome, iPhone Safari에서 동작하고, 카카오톡 인앱 브라우저에서는 안 될 수 있어요.
