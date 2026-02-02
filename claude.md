# Arky Clone Project - Claude Instructions

## 필수 참고 문서

- **Arky 공식 문서**: https://arky.so/docs/index
- 구현 시 반드시 이 문서를 참고할 것

## 디자인 시스템 (arky.so 기준)

### Typography
- **Primary**: Inter (400, 500, 600, 700, 900)
- **Display**: Inter Display
- **Supporting**: Baskervville, Roboto Mono, Satoshi

### Color Palette
- Dark background: `#08090a`, `#0f0f10`
- Light background: `#fff`, `#f7f8f8`
- Accent blue: `#188ef6`
- Text dark: `#1d1d1f`
- Text light: `#e4e6e1`, `#edebe8`

### Breakpoints
- Desktop: 1200px+
- Tablet: 810px–1199px
- Mobile: <810px

## 개발 워크플로우

### 스킬 사용 (필수)
사용 가능한 스킬을 적극적으로 활용:
- `ui-ux-pro-max`: UI/UX 디자인 작업 시
- `context7`: 라이브러리 문서 조회 시
- `supabase-postgres-best-practices`: Supabase/Postgres 작업 시
- `next-best-practices`: Next.js 코드 작성 시
- `vercel-react-best-practices`: React 성능 최적화 시
- `tailwind-design-system`: Tailwind 디자인 시스템 구축 시

### 코드 리뷰 (세션 종료 시 필수)
**매 세션이 끝날 때마다 코드 리뷰 에이전트에게 검사를 받고 피드백을 반영할 것.**

리뷰 요청 시 포함할 내용:
1. 변경된 파일 목록
2. 주요 변경 사항 요약
3. 성능/보안 관련 우려 사항

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Database/Auth**: Supabase
- **Styling**: Tailwind CSS + shadcn/ui
- **Theme**: next-themes (dark/light mode)
- **Icons**: Lucide React

## 프로젝트 구조

```
src/
├── app/                    # Next.js App Router
│   ├── (marketing)/        # 랜딩, 문서 등
│   ├── app/                # 인증된 사용자 영역
│   └── auth/               # 인증 관련
├── components/
│   ├── ui/                 # shadcn/ui 컴포넌트
│   └── ...                 # 커스텀 컴포넌트
└── lib/
    └── supabase/           # Supabase 클라이언트
```

## 환경 변수

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## 단축키 가이드 (Keyboard Shortcuts)

### 글로벌 (Global)
- **단축키 가이드 열기**: `Ctrl + ,`
- **커맨드 메뉴 열기**: `Ctrl + K`
- **테마 전환**: `Ctrl + Shift + L`
- **왼쪽 사이드바 토글**: `Ctrl + \`
- **오른쪽 사이드바 토글**: `Ctrl + /`

### 캔버스 뷰 (Canvas View)
- **선택 도구 (Selection)**: `V`
- **이동 도구 (Hand)**: `H`
- **텍스트 도구 (Text)**: `T`
- **줌 인/아웃**: `Ctrl + +/-` (또는 마우스 휠)
- **캔버스 이동**: `Space` 드래그 또는 우클릭 드래그

### 문서 뷰 (Document View)
- **커맨드 메뉴 열기**: `Ctrl + K`

