# Arky Clone - Knowledge Canvas Platform

Arky.so 영감을 받은 지식 캔버스 플랫폼입니다. Tiptap 에디터 기반의 자유로운 노트 작성과 시각적 캔버스를 제공합니다.

## 🚀 Quick Start

### 1. 환경 변수 설정

`.env.local` 파일이 이미 설정되어 있습니다:
```env
NEXT_PUBLIC_SUPABASE_URL=https://wwvnypfoyadmnoglrxmn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. 데이터베이스 마이그레이션

**중요**: 앱을 실행하기 전에 데이터베이스 마이그레이션을 먼저 실행해야 합니다.

[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) 파일을 참고하세요.

**가장 쉬운 방법**:
1. https://supabase.com/dashboard/project/wwvnypfoyadmnoglrxmn/sql/new
2. `supabase/migrations/001_initial_schema.sql` 내용 복사
3. SQL Editor에 붙여넣기 후 **Run** 클릭

### 3. 의존성 설치 및 실행

```bash
npm install
npm run dev
```

브라우저에서 http://localhost:3000 접속

## ✨ 주요 기능

### 🎨 캔버스 뷰
- **자유로운 노트 배치**: 드래그 앤 드롭으로 노트를 자유롭게 이동
- **크기 조절**: 각 노트의 크기를 자유롭게 조절
- **줌 & 팬**:
  - 줌: `Ctrl/Cmd + 마우스 휠` 또는 우측 하단 줌 컨트롤 (0.5x ~ 2x)
  - 팬: 스페이스바 + 드래그 또는 중간 마우스 버튼 드래그
- **그리드 배경**: 시각적 정렬을 위한 그리드
- **더블클릭으로 노트 추가**: 캔버스 빈 공간을 더블클릭하여 새 노트 생성

### 📝 문서 뷰
- **선형 문서 형태**: 노트들을 수직으로 나열하여 보기
- **Tiptap 에디터**: 리치 텍스트 편집 기능
- **자동 저장**: 내용 변경 시 자동으로 저장

### 🏷️ 태그 시스템
- **태그 생성 및 관리**: 캔버스와 노트에 태그 추가
- **인라인 태그 생성**: 검색창에서 바로 새 태그 생성
- **색상 지원**: 각 태그에 색상 부여 가능
- **빠른 필터링**: 태그로 캔버스 필터링

### 🎨 노트 커스터마이징
- **8가지 색상 테마**: default, yellow, green, blue, purple, pink, red, orange
- **다크 모드 지원**: 시스템 설정에 따라 자동 전환
- **리치 텍스트 편집**:
  - 헤딩 (H1, H2, H3)
  - 볼드, 이탤릭, 취소선
  - 코드 블록 (문법 하이라이팅 지원)
  - 체크리스트
  - 링크
  - 이미지

### 🔐 인증
- **Supabase Auth**: 이메일 기반 인증
- **Row Level Security (RLS)**: 사용자별 데이터 격리

## 🛠️ 기술 스택

- **Frontend**: Next.js 16 (App Router)
- **Editor**: Tiptap (리치 텍스트 에디터)
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Icons**: Lucide React
- **Theme**: next-themes (다크 모드)

## 📁 프로젝트 구조

```
src/
├── app/                          # Next.js App Router
│   ├── (marketing)/               # 마케팅 페이지 (랜딩, 문서)
│   ├── app/                       # 인증된 사용자 영역
│   │   ├── canvas/                # 캔버스 목록 및 상세
│   │   └── notes/                 # 노트 관련 페이지
│   ├── auth/                      # 인증 콜백
│   └── signin/                    # 로그인 페이지
├── components/
│   ├── canvas/                    # 캔버스 관련 컴포넌트
│   │   ├── canvas-view.tsx       # 캔버스 뷰 (드래그/줌/팬)
│   │   ├── document-view.tsx     # 문서 뷰
│   │   ├── note-card.tsx         # 노트 카드 (드래그/리사이즈)
│   │   └── canvas-header.tsx     # 캔버스 헤더 (제목, 뷰 전환)
│   ├── editor/                    # 에디터 컴포넌트
│   │   ├── tiptap-editor.tsx     # Tiptap 에디터
│   │   └── toolbar.tsx           # 에디터 툴바
│   ├── tags/                      # 태그 관련 컴포넌트
│   │   └── tag-selector.tsx      # 태그 선택기
│   └── ui/                        # shadcn/ui 기본 컴포넌트
└── lib/
    ├── api/                       # API 함수들
    │   ├── canvases.ts           # 캔버스 CRUD
    │   └── tags.ts               # 태그 CRUD
    ├── supabase/                  # Supabase 클라이언트
    │   ├── client.ts             # 클라이언트 사이드
    │   ├── server.ts             # 서버 사이드
    │   └── middleware.ts         # 미들웨어
    ├── types.ts                   # TypeScript 타입 정의
    └── utils.ts                   # 유틸리티 함수
```

## 🗄️ 데이터베이스 스키마

### canvases
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users)
- `title` (text)
- `description` (text, nullable)
- `content` (jsonb) - Tiptap JSON
- `view_mode` (text) - 'canvas' | 'document'
- `is_archived` (boolean)
- `created_at`, `updated_at` (timestamptz)

### notes
- `id` (uuid, PK)
- `canvas_id` (uuid, FK → canvases)
- `user_id` (uuid, FK → auth.users)
- `title` (text)
- `content` (jsonb) - Tiptap JSON
- `position_x`, `position_y` (float) - 캔버스 위치
- `width`, `height` (float) - 노트 크기
- `color` (text) - 노트 색상
- `z_index` (integer) - 레이어 순서
- `created_at`, `updated_at` (timestamptz)

### tags
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users)
- `name` (text, unique per user)
- `color` (text)
- `created_at` (timestamptz)

### canvas_tags, note_tags
- Many-to-many 관계 테이블
- ON DELETE CASCADE

### resources
- `id` (uuid, PK)
- `user_id` (uuid, FK → auth.users)
- `canvas_id` (uuid, FK → canvases, nullable)
- `type` (text) - 'file' | 'link' | 'image'
- `name`, `url`, `file_path` (text)
- `metadata` (jsonb)
- `created_at` (timestamptz)

## 🔒 보안

- **Row Level Security (RLS)**: 모든 테이블에 RLS 적용
- **인증 검증**: 미들웨어에서 `/app` 경로 보호
- **Open Redirect 방지**: 인증 콜백에서 경로 검증

## 🚧 Todo

- [ ] AI 기능 통합
  - 콘텐츠 개선
  - 포맷 변환
  - 요약 생성
- [ ] 협업 기능
  - 실시간 공동 편집
  - 공유 링크
- [ ] 파일 업로드
  - 이미지 첨부
  - 파일 관리

## 📚 참고 문서

- [Arky 공식 문서](https://arky.so/docs/index)
- [Next.js 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Tiptap 문서](https://tiptap.dev)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)

## 📝 개발 가이드

프로젝트 가이드라인은 [CLAUDE.md](./CLAUDE.md)를 참고하세요.

## 🤝 Contributing

이 프로젝트는 학습 목적으로 만들어졌습니다. 이슈나 PR은 언제든 환영합니다!

## 📄 License

MIT
