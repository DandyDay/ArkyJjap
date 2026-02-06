# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Arky Clone - A knowledge canvas platform inspired by Arky.so, featuring Tiptap editor-based note-taking with visual canvas workspace and real-time collaboration.

## Development Commands

```bash
# Development
npm run dev              # Start development server (localhost:3000)
npm run build            # Build for production
npm run start            # Start production server
npm run lint             # Run ESLint

# Database (requires Supabase CLI login)
npm run db:link          # Link to Supabase project
npm run db:push          # Push migrations to database
```

**IMPORTANT**: Before first run, apply database migrations via [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md). Easiest method: copy `supabase/migrations/001_initial_schema.sql` content and run in Supabase Dashboard SQL Editor.

## Tech Stack

- **Framework**: Next.js 16 (App Router, React 19)
- **Database/Auth**: Supabase (PostgreSQL + Row Level Security)
- **Editor**: Tiptap (rich text, JSONContent format)
- **Canvas**: @xyflow/react (ReactFlow v12)
- **AI**: Vercel AI SDK with multiple providers (OpenAI, Google Gemini, Groq)
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Theme**: next-themes (dark/light mode)
- **Icons**: Lucide React
- **Real-time**: Supabase Realtime (collaboration, presence)

## Architecture Patterns

### Supabase Client Pattern
- **Client-side** (`@/lib/supabase/client`): Singleton browser client for client components
- **Server-side** (`@/lib/supabase/server`): Cookie-based SSR client for Server Components/Actions
- **Middleware** (`@/lib/supabase/middleware`): Session refresh for `/app` routes
- All tables use RLS policies scoped to `auth.uid()`

### Canvas Architecture
- **ReactFlow** manages node positioning, dragging, zooming, panning
- Notes are ReactFlow nodes with `type: "note"`, custom `NoteNode` component
- Position/size stored in `notes` table (position_x, position_y, width, height)
- Z-index managed via timestamp-based z_index field
- Edges stored in `edges` table, synced with ReactFlow edges state

### Real-time Collaboration
- Uses Supabase Realtime channels (presence + broadcast)
- Each user gets random color on join (`useRealtimeCanvas` hook)
- Syncs: cursor positions, node movements, selections
- Components: `RemoteCursor`, `Collaborators`
- Canvas members managed via `canvas_members` table + API routes

### AI Integration
- Route: `src/app/api/chat/route.ts`
- Supports multiple models: GPT-4o, Gemini, Groq models
- **Agent Mode**: Provides tools (createNote, updateNote, deleteNote, listNotes) for canvas manipulation
- Uses Vercel AI SDK's `streamText` with `convertToModelMessages`
- Content converted to Tiptap JSON format before DB insert

### API Routes Structure
```
src/app/api/
├── chat/route.ts                    # AI chat with agent mode
├── ai/text/route.ts                 # Text generation
├── shell-context/route.ts           # Shell context for AI
├── users/search/route.ts            # User search for collaboration
└── canvases/[id]/members/route.ts   # Canvas member management
```

### Data Flow
1. **Editor** (Tiptap) → JSONContent → Supabase
2. **Canvas** (ReactFlow) → Node changes → Supabase + Realtime broadcast
3. **AI** → Tool calls → Supabase mutations → UI updates

## Environment Variables

Required in `.env.local`:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...  # For server-side admin ops

# AI Providers (Optional - based on usage)
OPENAI_API_KEY=sk-...              # For GPT models
GOOGLE_GENERATIVE_AI_API_KEY=...   # For Gemini models
GROQ_API_KEY=gsk_...               # For Groq models
```

## Import Aliases

`@/*` maps to `src/*` (configured in `tsconfig.json`)

## Key Features & UI Patterns

### Canvas View
- Double-click canvas to create note
- Drag notes by header (drag-handle class)
- Resize via NodeResizer component
- Tools: Select (V), Hand (H), Text (T)
- Zoom: Ctrl+Scroll or zoom controls (0.5x-2x)
- Pan: Space+Drag or Right-click drag

### Editor (Tiptap)
- Stores content as JSONContent (ProseMirror format)
- Extensions: StarterKit, CodeBlock (lowlight), Image, Link, TaskList, Placeholder
- Bubble menu for formatting (appears on selection)
- Auto-save on content change

### Tags System
- Many-to-many via `canvas_tags`, `note_tags` junction tables
- Inline creation from search/selector
- Color-coded with 8 theme options

### Design System (arky.so reference)

**Typography**: Inter (primary), Inter Display, Baskervville, Roboto Mono, Satoshi
**Colors**:
- Dark: `#08090a`, `#0f0f10`
- Light: `#fff`, `#f7f8f8`
- Accent: `#188ef6`
- Text: `#1d1d1f` (dark), `#e4e6e1`, `#edebe8` (light)

**Breakpoints**: Desktop 1200px+, Tablet 810-1199px, Mobile <810px

## Keyboard Shortcuts

### Global
- `Ctrl+K`: Command menu
- `Ctrl+Shift+L`: Toggle theme
- `Ctrl+\`: Toggle left sidebar
- `Ctrl+/`: Toggle right sidebar

### Canvas
- `V`: Selection tool
- `H`: Hand tool
- `T`: Text tool
- `Ctrl++/-`: Zoom in/out
- `Space+Drag`: Pan canvas

## Development Workflow

### Recommended Skills
Use these skills when working on specific areas:
- `ui-ux-pro-max`: UI/UX design tasks
- `context7`: Library documentation lookup
- `supabase-postgres-best-practices`: Database/auth work
- `next-best-practices`: Next.js code
- `vercel-react-best-practices`: React optimization
- `tailwind-design-system`: Design system work

### Code Review (End of Session)
**매 세션이 끝날 때마다 코드 리뷰 에이전트에게 검사를 받고 피드백을 반영할 것.**

Review should include:
1. Changed files list
2. Summary of changes
3. Performance/security concerns

## Reference Documentation

- **Arky Official**: https://arky.so/docs/index (구현 시 필수 참고)
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Tiptap: https://tiptap.dev
- ReactFlow: https://reactflow.dev
- shadcn/ui: https://ui.shadcn.com
