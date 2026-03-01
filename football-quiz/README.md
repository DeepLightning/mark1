# ⚽ 축구 선수 퀴즈

팀 이력을 보고 선수를 맞추는 퀴즈 게임입니다!

## 🎮 게임 방법

1. 여러 축구팀의 이름이 주어집니다
2. 해당 팀들을 모두 거쳐간 선수의 이름을 맞춰보세요
3. 정답 하나당 10점을 획득합니다
4. 막히면 힌트를 사용할 수 있습니다
5. 게임이 끝나면 리더보드에 점수를 등록할 수 있습니다

## 🚀 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. Firebase 설정

Firebase 프로젝트를 생성하고 Firestore 데이터베이스를 활성화해야 합니다.

#### Firebase 프로젝트 생성

1. [Firebase Console](https://console.firebase.google.com/)에 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름 입력 (예: football-quiz)
4. Google Analytics 설정 (선택사항)
5. 프로젝트 생성 완료

#### Firestore 데이터베이스 활성화

1. Firebase Console에서 "Firestore Database" 메뉴 선택
2. "데이터베이스 만들기" 클릭
3. **테스트 모드**로 시작 (개발용)
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
   > ⚠️ 프로덕션 환경에서는 보안 규칙을 강화해야 합니다!

4. 위치 선택 (예: asia-northeast3 - 서울)

#### Firebase 설정 정보 가져오기

1. Firebase Console에서 프로젝트 설정 (⚙️ 아이콘) 클릭
2. "내 앱" 섹션에서 웹 앱 추가 (`</>` 아이콘)
3. 앱 닉네임 입력 (예: football-quiz-web)
4. Firebase SDK 구성 정보 복사

#### 환경 변수 설정

1. `.env.example` 파일을 `.env`로 복사:
   ```bash
   cp .env.example .env
   ```

2. `.env` 파일을 열고 Firebase 설정 정보 입력:
   ```env
   VITE_FIREBASE_API_KEY=your_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   ```

### 3. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:5173](http://localhost:5173)으로 접속

## 📦 빌드

프로덕션 빌드:

```bash
npm run build
```

빌드된 파일은 `dist` 폴더에 생성됩니다.

## 🚢 배포

### Vercel (추천)

1. [Vercel](https://vercel.com)에 가입
2. GitHub 저장소 연결
3. 환경 변수 설정 (.env 파일 내용)
4. 배포 클릭

### Firebase Hosting

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

### Netlify

1. [Netlify](https://netlify.com)에 가입
2. "New site from Git" 선택
3. GitHub 저장소 연결
4. Build command: `npm run build`
5. Publish directory: `dist`
6. 환경 변수 설정
7. Deploy

## 🛠 기술 스택

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Backend/Database**: Firebase Firestore
- **Styling**: CSS3 (Vanilla CSS)
- **Deployment**: Vercel / Firebase Hosting / Netlify

## 📁 프로젝트 구조

```
football-quiz/
├── src/
│   ├── components/          # React 컴포넌트
│   │   ├── QuizGame.tsx    # 퀴즈 게임 메인 컴포넌트
│   │   ├── GameOver.tsx    # 게임 종료 화면
│   │   └── Leaderboard.tsx # 리더보드
│   ├── data/               # 퀴즈 데이터
│   │   └── quizzes.ts      # 퀴즈 문제 목록
│   ├── firebase/           # Firebase 설정
│   │   └── config.ts       # Firebase 초기화
│   ├── types/              # TypeScript 타입 정의
│   │   └── quiz.ts         # 퀴즈 관련 타입
│   ├── App.tsx             # 메인 앱 컴포넌트
│   ├── App.css             # 앱 스타일
│   └── main.tsx            # 앱 진입점
├── .env.example            # 환경 변수 예시
└── package.json
```

## 🎯 주요 기능

- ✅ 랜덤 퀴즈 문제 제공
- ✅ 힌트 시스템
- ✅ 실시간 점수 계산
- ✅ Firebase 기반 리더보드
- ✅ 반응형 디자인 (모바일/데스크톱)
- ✅ 난이도별 문제 분류

## 🔧 퀴즈 데이터 추가하기

`src/data/quizzes.ts` 파일에 새로운 퀴즈를 추가할 수 있습니다:

```typescript
{
  id: '11',
  teams: ['팀1', '팀2', '팀3'],
  answer: '선수 이름',
  difficulty: 'easy', // 'easy' | 'medium' | 'hard'
  hints: ['힌트1', '힌트2', '힌트3']
}
```

## 📝 라이선스

MIT

## 🤝 기여

이슈나 PR은 언제든지 환영합니다!

---

Made with ❤️ for football fans
