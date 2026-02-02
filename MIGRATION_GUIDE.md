# Database Migration Guide

## 🎯 Quick Start (가장 쉬운 방법)

**Supabase Dashboard에서 직접 실행:**

1. 다음 링크로 이동:
   ```
   https://supabase.com/dashboard/project/wwvnypfoyadmnoglrxmn/sql/new
   ```

2. `supabase/migrations/001_initial_schema.sql` 파일의 내용을 복사

3. SQL Editor에 붙여넣기 후 **Run** 클릭

## 📋 생성되는 테이블

- ✅ `canvases` - 캔버스 작업 공간
- ✅ `notes` - 캔버스 내 노트 블록
- ✅ `tags` - 태그 관리
- ✅ `canvas_tags` - 캔버스-태그 관계
- ✅ `note_tags` - 노트-태그 관계
- ✅ `resources` - 파일 및 리소스
- ✅ RLS (Row Level Security) 정책 - 모든 테이블에 적용됨

## 🔧 대안 방법

### Option 1: Supabase CLI (로그인 필요)

```bash
# 1. Supabase CLI 로그인
npx supabase login

# 2. 프로젝트 연결
npm run db:link

# 3. 마이그레이션 실행
npm run db:push
```

### Option 2: 직접 데이터베이스 연결 (비밀번호 필요)

```bash
npx supabase db push --db-url 'postgresql://postgres.wwvnypfoyadmnoglrxmn:[YOUR_DB_PASSWORD]@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres'
```

데이터베이스 비밀번호는 Supabase Dashboard > Settings > Database에서 확인할 수 있습니다.

## ✨ 마이그레이션 완료 후

마이그레이션이 완료되면 다음 명령어로 앱을 실행하세요:

```bash
npm run dev
```

브라우저에서 http://localhost:3000으로 접속하여 확인하세요.

## 🔍 마이그레이션 확인

Supabase Dashboard의 Table Editor에서 다음 테이블들이 생성되었는지 확인:
- canvases
- notes
- tags
- canvas_tags
- note_tags
- resources

각 테이블의 RLS가 활성화되어 있는지도 확인하세요.
