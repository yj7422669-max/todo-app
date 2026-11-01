# 오늘의 할 일

Next.js App Router와 TypeScript로 만든 투두 앱입니다. 첫 화면에서 미니멀·파스텔·다크모드 시안 중 하나를 골라 사용하고, 할 일을 추가하거나 완료 표시 또는 삭제할 수 있습니다. 시안 선택과 할 일 목록은 현재 브라우저의 `localStorage`에 저장됩니다.

## 처음 실행하기

1. [Node.js](https://nodejs.org/) 20.9 이상을 설치합니다.
2. 터미널에서 이 프로젝트 폴더로 이동합니다.
3. PowerShell에서 필요한 패키지를 설치합니다. (`npm.ps1` 실행 정책 오류를 피하려고 `npm.cmd`를 사용합니다.)

   ```bash
   npm.cmd install
   ```

4. 개발 서버를 시작합니다.

   ```bash
   npm.cmd run dev
   ```

5. 브라우저에서 [http://localhost:3000](http://localhost:3000)을 엽니다.

서버를 종료하려면 터미널에서 `Ctrl + C`를 누르세요. 코드를 수정하고 저장하면 브라우저 화면이 자동으로 갱신됩니다.

macOS나 Linux에서는 위 명령의 `npm.cmd`를 `npm`으로 바꿔 실행하면 됩니다.

## 주요 폴더와 파일

- `app/page.tsx`: 시안 선택 화면과 투두 기능
- `app/layout.tsx`: 페이지 공통 틀과 브라우저 탭 제목
- `app/globals.css`: 세 가지 시안과 반응형 스타일
- `package.json`: 실행 명령과 Next.js/React 의존성
- `tsconfig.json`: TypeScript 설정

## 참고

투두 목록은 사용하는 브라우저와 기기에 저장됩니다. 다른 브라우저나 기기와 동기화되지는 않습니다. 브라우저 사이트 데이터를 지우면 저장된 목록도 사라집니다.
