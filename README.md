# EduMonitor (경기도교육청 웹사이트 모니터링 시스템)

경기도교육청 산하 기관 및 학교 웹사이트의 가용성을 5분 단위로 모니터링하는 시스템입니다.

## 주요 기능
- **실시간 모니터링**: 대상 웹사이트의 HTTP 상태를 체크하여 정상/장애 여부를 판단합니다.
- **인프라 정보 관리**: WAS, WEB, DB 서버 정보를 관리합니다.
- **모바일 최적화**: 25개 이상의 모니터링 대상을 모바일에서도 한눈에 볼 수 있는 카드 뷰를 제공합니다.
- **엑셀 일괄 등록**: 관리자 페이지에서 엑셀 파일로 대량의 모니터링 대상을 등록할 수 있습니다.

## 기술 스택
- **Frontend**: Next.js 15 (App Router), Tailwind CSS
- **Backend/Database**: Cloudflare Pages Functions, Cloudflare D1 (SQLite)
- **Deployment**: Cloudflare Pages

## 로컬 개발 환경 설정
1. 의존성 설치:
   ```bash
   npm install
   ```
2. 로컬 데이터베이스 생성 (최초 1회):
   ```bash
   npx wrangler d1 execute sentinel-db --local --file=d1/schema.sql
   ```
3. 개발 서버 실행:
   ```bash
   npm run dev
   ```

## 배포
Cloudflare Pages에 배포됩니다.
```bash
npx wrangler pages deploy .vercel/output/static --project-name edumonitor
```
