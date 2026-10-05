# 우리 반 O/X — 실시간 교실 퀴즈

React + Vite + Firebase Realtime Database로 만든 중학교 수업용 실시간 O/X 투표 앱입니다. 교사용 `/teacher`, 학생용 `/join`, 전자칠판용 `/display` 화면이 Firebase 상태를 실시간 구독합니다.

## 주요 동작

- 교사가 결석 번호를 제외하고 6자리 수업방과 학생 입장 QR을 생성합니다.
- 학생은 번호와 닉네임으로 입장하며, 같은 번호의 동시 점유는 Firebase 트랜잭션으로 차단됩니다.
- 상태는 `waiting → voting → closed → result → finished` 순서로 진행됩니다.
- 투표 중에는 제출 여부만 공개하고, O/X별 인원은 결과 공개 전까지 교사에게도 표시하지 않습니다.
- 원시 답안은 학생/전자칠판에서 읽을 수 없도록 Database Rules로 보호합니다.
- 10문제 종료 후 미응답을 오답 처리하고 공동 1위를 포함한 최종 결과를 공개합니다.
- 새로고침해도 Firebase 데이터와 브라우저의 익명 로그인/입장 정보를 이용해 현재 상태를 복구합니다.

## 처음부터 배포까지 따라 하기

아래 순서를 그대로 진행하면 됩니다. Firebase와 Vercel의 화면 언어에 따라 메뉴가 영어 또는 한국어로 보일 수 있어 두 이름을 함께 적었습니다. 이 프로젝트에는 Node.js 20 이상을 권장합니다.

### 1. Firebase 프로젝트 생성

1. 브라우저에서 [Firebase Console](https://console.firebase.google.com/)을 엽니다.
2. Google 계정으로 로그인합니다.
3. 콘솔 첫 화면에서 **프로젝트 만들기(Create a project)**를 누릅니다.
   - 기존 Google Cloud 프로젝트를 쓰는 화면이 보이면 새 프로젝트를 만드는 옵션을 선택합니다.
4. **프로젝트 이름**에 알아보기 쉬운 이름을 입력합니다. 예: `my-class-ox-quiz`
5. 자동으로 생성된 **프로젝트 ID**를 확인합니다.
   - 프로젝트 ID는 전 세계에서 고유해야 합니다.
   - 생성 후에는 바꿀 수 없지만, 앱 화면에 표시되는 이름은 나중에 바꿀 수 있습니다.
6. **계속(Continue)**을 누릅니다.
7. Google Analytics 사용 여부를 묻는다면 이 앱에서는 필수가 아니므로 **사용 중지**해도 됩니다.
8. **프로젝트 만들기(Create project)**를 누릅니다.
9. 생성이 끝나면 **계속(Continue)**을 눌러 프로젝트 개요 화면으로 들어갑니다.

정상 완료 기준: 왼쪽 위에 방금 만든 프로젝트 이름이 보이고, 가운데에 “앱에 Firebase를 추가하여 시작하기” 영역이 표시됩니다.

### 2. Realtime Database 생성

> **Cloud Firestore가 아니라 Realtime Database를 선택해야 합니다.** 두 제품은 서로 다릅니다.

1. Firebase 프로젝트의 왼쪽 메뉴에서 **빌드(Build)**를 펼칩니다.
2. **Realtime Database**를 누릅니다.
3. 화면 가운데의 **데이터베이스 만들기(Create Database)**를 누릅니다.
4. 데이터베이스 위치를 선택합니다.
   - 한국에서 주로 사용한다면 화면에 제공되는 위치 중 가까운 아시아 리전을 선택합니다.
   - 선택한 위치는 나중에 쉽게 변경할 수 없으므로 확인 후 진행합니다.
5. **다음(Next)**을 누릅니다.
6. 보안 모드 선택 화면에서 **잠금 모드로 시작(Start in locked mode)**을 선택합니다.
   - 테스트 모드는 일정 기간 모든 접근을 허용할 수 있으므로 선택하지 않는 것을 권장합니다.
   - 잠금 모드에서는 뒤의 6단계에서 우리 앱 전용 규칙을 적용하기 전까지 접근이 차단됩니다.
7. **사용 설정(Enable)**을 누릅니다.
8. 생성이 끝나면 **데이터(Data)** 탭 상단에 데이터베이스 주소를 확인합니다.
   - 예: `https://my-class-ox-quiz-default-rtdb.asia-southeast1.firebasedatabase.app`
   - 이 주소는 5단계의 `VITE_FIREBASE_DATABASE_URL` 값으로 사용합니다.

정상 완료 기준: Realtime Database 화면에 **데이터(Data)**, **규칙(Rules)**, **백업(Backups)** 등의 탭이 보입니다.

### 3. Anonymous Authentication 활성화

학생과 교사가 별도 회원가입 없이 안전 규칙이 적용된 임시 계정으로 접속하도록 익명 인증을 켭니다.

1. 왼쪽 메뉴에서 **빌드(Build) → Authentication**을 누릅니다.
2. 처음 들어왔다면 **시작하기(Get started)**를 누릅니다.
3. 상단의 **로그인 방법(Sign-in method)** 탭을 엽니다.
4. 로그인 제공업체 목록에서 **익명(Anonymous)**을 누릅니다.
5. **사용 설정(Enable)** 스위치를 켭니다.
6. **저장(Save)**을 누릅니다.

정상 완료 기준: 로그인 제공업체 목록의 **익명(Anonymous)** 행에 **사용 설정됨(Enabled)**이 표시됩니다.

### 4. Firebase 웹 앱 등록

1. 왼쪽 위의 **프로젝트 개요(Project Overview)**를 누릅니다.
2. 프로젝트 개요 화면 가운데의 플랫폼 아이콘 중 `</>` 모양의 **웹(Web)** 아이콘을 누릅니다.
   - 이미 다른 앱이 등록되어 있다면 개요 화면의 **앱 추가(Add app) → 웹(Web)**을 누릅니다.
3. **앱 닉네임**에 `OX Quiz Web`처럼 알아보기 쉬운 이름을 입력합니다.
4. **이 앱의 Firebase Hosting도 설정** 체크박스가 보이더라도 체크하지 않습니다. 이 프로젝트는 Vercel에 배포합니다.
5. **앱 등록(Register app)**을 누릅니다.
6. `firebaseConfig` 코드가 나타나면 이 브라우저 탭을 열어 둡니다. 다음 단계에서 값을 복사합니다.
7. SDK 설치 명령은 이미 프로젝트에 적용되어 있으므로 다시 실행할 필요가 없습니다.

나중에 설정값을 다시 찾으려면 다음 순서로 이동합니다.

1. 프로젝트 화면 왼쪽 위의 톱니바퀴 아이콘을 누릅니다.
2. **프로젝트 설정(Project settings)**을 누릅니다.
3. **일반(General)** 탭에서 **내 앱(Your apps)** 영역까지 아래로 스크롤합니다.
4. 등록한 웹 앱을 선택한 뒤 **SDK 설정 및 구성(SDK setup and configuration)**에서 **구성(Config)**을 선택합니다.

### 5. `.env.local` 작성

1. VS Code 등에서 이 프로젝트 폴더를 엽니다.
2. 프로젝트 최상위 폴더의 `.env.example` 파일을 복사합니다.
3. 복사본 이름을 정확히 `.env.local`로 변경합니다.
   - Windows 탐색기에서 확장자가 숨겨져 있으면 `.env.local.txt`가 되지 않았는지 확인합니다.
   - `.env.local`은 `.gitignore`에 포함되어 있으므로 GitHub에 올라가지 않습니다.
4. Firebase 콘솔의 `firebaseConfig`에서 각 값을 복사해 아래처럼 대응시킵니다.

```text
firebaseConfig의 apiKey            → VITE_FIREBASE_API_KEY
firebaseConfig의 authDomain        → VITE_FIREBASE_AUTH_DOMAIN
Realtime Database의 주소           → VITE_FIREBASE_DATABASE_URL
firebaseConfig의 projectId         → VITE_FIREBASE_PROJECT_ID
firebaseConfig의 storageBucket     → VITE_FIREBASE_STORAGE_BUCKET
firebaseConfig의 messagingSenderId → VITE_FIREBASE_MESSAGING_SENDER_ID
firebaseConfig의 appId             → VITE_FIREBASE_APP_ID
```

`.env.local` 예시:

```dotenv
VITE_FIREBASE_API_KEY=AIzaSyExample123
VITE_FIREBASE_AUTH_DOMAIN=my-class-ox-quiz.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://my-class-ox-quiz-default-rtdb.asia-southeast1.firebasedatabase.app
VITE_FIREBASE_PROJECT_ID=my-class-ox-quiz
VITE_FIREBASE_STORAGE_BUCKET=my-class-ox-quiz.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abc123example
```

주의 사항:

- 값 앞뒤에 따옴표를 붙이지 않아도 됩니다.
- `=` 앞뒤에 공백을 넣지 마세요.
- `VITE_FIREBASE_DATABASE_URL`은 `firebaseConfig`에 보이지 않을 수 있습니다. 이 경우 2단계에서 확인한 Realtime Database 주소를 직접 넣습니다.
- `.env.local`을 수정한 뒤에는 실행 중인 개발 서버를 껐다가 다시 시작해야 반영됩니다.
- Firebase 웹 설정값은 브라우저 앱에서 사용되는 식별 정보이며 서버 비밀번호가 아닙니다. 실제 데이터 보호는 반드시 다음 단계의 Database Rules가 담당합니다.

### 6. `database.rules.json` 적용

1. 이 프로젝트에서 `database.rules.json` 파일을 엽니다.
2. 파일 전체를 선택해 복사합니다.
3. Firebase Console로 돌아갑니다.
4. 왼쪽 메뉴에서 **빌드(Build) → Realtime Database**를 누릅니다.
5. 상단의 **규칙(Rules)** 탭을 누릅니다.
6. 편집기에 들어 있는 기존 내용을 전부 지웁니다.
7. 복사한 `database.rules.json` 내용을 붙여 넣습니다.
8. 편집기에서 빨간 오류 표시가 없는지 확인합니다.
9. 오른쪽 위의 **게시(Publish)**를 누릅니다.
10. 경고 또는 확인 창이 나타나면 규칙 내용을 다시 확인하고 게시를 완료합니다.

정상 완료 기준: Rules 탭에 새 규칙이 남아 있고 게시 완료 메시지가 표시됩니다. 이 규칙은 학생이 다른 학생의 원시 답안을 읽지 못하게 하고, 교사만 집계와 최종 결과를 작성할 수 있도록 제한합니다.

> 앱이 데이터베이스에 접근하지 못하고 `PERMISSION_DENIED`가 나온다면 익명 인증이 활성화되었는지, 규칙을 **Firestore가 아닌 Realtime Database**에 게시했는지 먼저 확인하세요.

### 7. 로컬 테스트

#### 7-1. Node.js 확인

1. PowerShell 또는 VS Code의 **터미널 → 새 터미널**을 엽니다.
2. 프로젝트 폴더로 이동합니다.
3. 다음 명령으로 Node.js 버전을 확인합니다.

```powershell
node -v
```

`v20` 이상이 표시되면 됩니다. 명령을 찾을 수 없다는 메시지가 나오면 [Node.js 공식 사이트](https://nodejs.org/)에서 LTS 버전을 설치한 뒤 터미널을 다시 엽니다.

#### 7-2. 설치 및 실행

프로젝트 폴더의 터미널에서 다음 명령을 차례대로 실행합니다.

```powershell
npm install
npm run dev
```

터미널에 표시된 주소(일반적으로 `http://localhost:5173`)를 `Ctrl` 키를 누른 채 클릭하거나 브라우저 주소창에 입력합니다.

#### 7-3. 세 화면 테스트

1. `http://localhost:5173/teacher`를 엽니다.
2. 결석 번호를 선택적으로 입력하고 **수업방 만들기**를 누릅니다.
3. 방 코드와 QR이 나타나는지 확인합니다.
4. 다른 브라우저나 시크릿 창에서 `http://localhost:5173/join?room=방코드`를 엽니다.
5. 학생 번호와 닉네임을 입력해 입장합니다.
6. 또 다른 창에서 `http://localhost:5173/display?room=방코드`를 엽니다.
7. 교사 화면에서 **문제 시작**을 누르고 학생 화면에서 O 또는 X를 선택합니다.
8. 교사와 전자칠판에는 제출 인원만 보이고 O/X별 인원은 아직 보이지 않는지 확인합니다.
9. **투표 종료 → 결과 공개 → 다음 문제** 순서로 작동하는지 확인합니다.
10. 10문제까지 진행한 뒤 공동 1위와 개인 점수가 표시되는지 확인합니다.
11. 페이지를 새로고침해도 현재 문제가 유지되는지 확인합니다.

개발 서버를 종료하려면 터미널에서 `Ctrl + C`를 누릅니다.

자주 발생하는 문제:

- **Firebase 환경변수가 없다는 안내:** `.env.local`의 위치와 파일 이름을 확인하고 개발 서버를 재시작합니다.
- **`auth/invalid-api-key`:** `VITE_FIREBASE_API_KEY`가 잘못 복사되었거나 따옴표·공백이 섞였는지 확인합니다.
- **`auth/operation-not-allowed`:** 3단계의 Anonymous 제공업체를 활성화하지 않은 상태입니다.
- **`PERMISSION_DENIED`:** 6단계의 Realtime Database Rules가 게시되지 않았거나 다른 Firebase 프로젝트의 설정값을 사용한 경우입니다.
- **방을 찾을 수 없음:** 교사와 학생 화면의 `room` 코드가 같은지 확인합니다.

### 8. Vercel 환경변수 설정

먼저 이 프로젝트를 GitHub, GitLab 또는 Bitbucket 저장소에 올립니다. `.env.local`은 절대 저장소에 추가하지 마세요.

1. [Vercel](https://vercel.com/)에 로그인합니다.
2. Dashboard에서 **Add New… → Project**를 누릅니다.
3. **Import Git Repository** 목록에서 이 프로젝트의 저장소를 찾습니다.
   - 목록에 없다면 **Configure GitHub App** 또는 해당 Git 제공업체 연결 버튼으로 저장소 접근을 허용합니다.
4. 저장소 오른쪽의 **Import**를 누릅니다.
5. **Configure Project** 화면에서 다음 값을 확인합니다.
   - **Framework Preset:** `Vite`
   - **Root Directory:** 저장소 루트에 이 프로젝트가 있으면 기본값 유지
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install` 또는 기본값 유지
6. 같은 화면의 **Environment Variables** 영역을 펼칩니다.
7. `.env.local`에 넣었던 아래 7개 이름과 값을 하나씩 등록합니다.

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_DATABASE_URL
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

각 변수마다:

1. **Name**에 `VITE_FIREBASE_...` 이름을 입력합니다.
2. **Value**에 `.env.local`의 `=` 오른쪽 값만 입력합니다.
3. 환경 선택 항목이 보이면 **Production**, **Preview**, **Development**를 모두 선택합니다.
4. **Add**를 눌러 저장합니다.

`VITE_`로 시작하는 값은 Vite 빌드 시 브라우저용 코드에 포함됩니다. 변수 이름의 철자와 대소문자를 정확히 유지해야 합니다.

### 9. 실제 배포

1. Vercel의 **Configure Project** 화면에서 환경변수 7개가 모두 등록되었는지 다시 확인합니다.
2. **Deploy**를 누릅니다.
3. 빌드 화면에서 완료될 때까지 기다립니다.
4. **Congratulations!** 또는 배포 성공 화면이 나타나면 **Continue to Dashboard**를 누릅니다.
5. Vercel 프로젝트의 **Domains** 또는 상단에 표시된 `https://프로젝트명.vercel.app` 주소를 복사합니다.
6. Firebase Console로 돌아갑니다.
7. **빌드(Build) → Authentication → 설정(Settings) → 승인된 도메인(Authorized domains)**으로 이동합니다.
8. **도메인 추가(Add domain)**를 누릅니다.
9. Vercel 주소에서 `https://`와 마지막 `/`를 제외한 도메인만 입력합니다.
   - 예: `my-class-ox-quiz.vercel.app`
10. **추가(Add)**를 누릅니다.
11. 커스텀 도메인을 Vercel에 연결했다면 그 도메인도 같은 방법으로 추가합니다.
12. 배포 주소 뒤에 `/teacher`를 붙여 실제 교사 화면을 엽니다.
13. 수업방을 만든 뒤 휴대전화나 태블릿으로 QR을 스캔해 `/join` 접속을 확인합니다.
14. `/display` 링크도 열어 실시간 상태가 함께 바뀌는지 최종 확인합니다.

Vercel에 환경변수를 나중에 수정했다면 기존 배포에는 자동 반영되지 않을 수 있습니다. 다음 순서로 다시 배포합니다.

1. Vercel 프로젝트에서 **Deployments** 탭을 엽니다.
2. 가장 최근 배포 오른쪽의 `…` 메뉴를 누릅니다.
3. **Redeploy**를 선택합니다.
4. 기존 빌드 캐시를 사용할지 묻는다면 환경변수 반영을 확실히 하기 위해 캐시 없이 재배포해도 됩니다.

`vercel.json`의 rewrite 설정이 `/teacher`, `/join`, `/display` 주소로 직접 들어가거나 새로고침할 때도 React 앱이 열리도록 처리합니다.

> 학생 번호 중복 방지는 같은 브라우저 세션의 재접속은 허용하면서 다른 익명 사용자 UID의 점유는 거부합니다. 학생이 기기를 바꿔 재입장해야 한다면 Firebase Console의 **Realtime Database → 데이터(Data) → rooms → 방 코드 → students → 학생 번호**에서 해당 학생 레코드를 삭제해야 합니다. 실제 수업 중에는 다른 학생 기록을 잘못 삭제하지 않도록 주의하세요.

## 화면 주소

- 교사: `https://your-domain.vercel.app/teacher`
- 학생: 교사 화면의 QR 또는 `/join?room=방코드`
- 전자칠판: 교사 화면의 링크 또는 `/display?room=방코드`

## 문제 수정

기본 10문제는 `src/data.js`의 `QUESTIONS` 배열에 있습니다. `id`는 1부터 순서대로 유지하고, `answer`는 문자열 `O` 또는 `X`만 사용하세요. 문제 수를 바꾸면 화면과 최종 점수의 분모도 자동으로 변경됩니다.

## 데이터 구조와 개인정보 보호

```text
rooms/{roomCode}/
├─ room/           # 상태, 현재 문제, 결석자, 투표 공개 상태
├─ students/       # 번호, 닉네임, 연결 여부, 익명 UID
├─ questions/      # 문제와 정답
├─ answers/        # 문제별 개인 답안 (방 소유 교사만 읽기)
├─ submitted/      # 번호별 제출 여부 (선택 내용 없음)
├─ publicStats/    # 결과 공개 후 O/X 합계
└─ finalResults/   # 종료 후 점수와 순위
```

중간 결과에는 개인별 선택, 정오답, 점수, 순위를 렌더링하지 않습니다. 학생 클라이언트는 `answers`를 읽을 권한이 없고, 공개 화면은 집계된 `publicStats`만 읽습니다. 다만 Firebase 클라이언트 앱의 설정값은 비밀키가 아니므로 반드시 제공된 Database Rules를 함께 적용해야 합니다.

## 확인 명령

```bash
npm run lint
npm run build
```
