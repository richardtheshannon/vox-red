# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Next.js CMS Template** - a modern content management system with a unique vertical slider presentation for content. The application has two main interfaces:

1. **Public Interface**: A full-screen vertical Swiper.js slider displaying articles
2. **Admin Interface**: Complete CRUD dashboard with drag-and-drop article ordering

## Essential Commands

### Development
```bash
npm run dev              # Start development server at localhost:3000
npm run build           # Build for production
npm run start           # Start production server
npm run lint            # Run ESLint
```

### Database Operations
```bash
npm run db:push         # Push Prisma schema to database (creates tables)
npm run db:seed         # Seed database with admin user and sample articles
npm run db:studio       # Open Prisma Studio (database GUI)
npx prisma generate     # Regenerate Prisma client (run after schema changes)
```

**Important**: After any database schema changes, always run `npx prisma generate` before restarting the dev server.

## Architecture Overview

### Real-time Updates System
- **SSE Manager** (`app/lib/realtime.ts`): Singleton class managing Server-Sent Events connections
- **SSE Endpoint** (`app/api/realtime/route.ts`): Streaming endpoint for real-time updates
- **Client Hook** (`app/hooks/useRealtime.ts`): React hook for consuming real-time updates
- **Integration**: All article CRUD operations broadcast changes via `sseManager.notifyArticleChange()`

### Authentication Flow
- **NextAuth.js v5** with credentials provider (`app/lib/auth.ts`)
- **Middleware** (`middleware.ts`): Protects `/admin/*` routes and admin API endpoints
- **Session Provider** (`app/components/providers/SessionProvider.tsx`): Wraps the app in root layout

### Data Models (Prisma)
```sql
User {
  id: UUID (primary key)
  email: String (unique)
  passwordHash: String
  createdAt: DateTime
}

Article {
  id: UUID (primary key) 
  title: String(255)
  subtitle: String(500) (optional)
  content: Text (rich HTML)
  orderPosition: Int (for drag-drop ordering)
  createdAt/updatedAt: DateTime
}
```

### Component Architecture
- **Public**: `ClientArticlesSwiper` → `ArticlesSwiper` → `ArticleSlide`
- **Admin**: `AdminLayout` wrapper with `ArticlesList` (drag-drop) and `ArticleForm` (Tiptap editor)
- **Editor**: Tiptap with `immediatelyRender: false` to prevent SSR hydration issues

### API Structure
```
/api/articles           # GET (public), POST (admin)
/api/articles/[id]      # GET (public), PUT/DELETE (admin)
/api/articles/reorder   # PUT (admin) - bulk position updates
/api/auth/[...nextauth] # NextAuth.js handlers
/api/realtime          # SSE endpoint
```

## Environment Variables

Required in both `.env.local` (Next.js) and `.env` (Prisma CLI):
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/dbname"
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your-password"
```

## Common Issues & Fixes

### Prisma Client Not Initialized
If you see `@prisma/client did not initialize yet`:
1. Run `npx prisma generate`
2. Restart the dev server

### Tiptap SSR Errors
The editor uses `immediatelyRender: false` to prevent hydration mismatches.

### Drag-and-Drop Prop Errors
`react-beautiful-dnd` requires explicit boolean props:
- `isDropDisabled={false}` on Droppable
- `isDragDisabled={isReordering}` on Draggable

## Key Dependencies

- **Next.js 15** with App Router
- **React 19** (requires `--legacy-peer-deps` for some packages)
- **NextAuth.js v5** (beta) with Prisma adapter
- **Tiptap** for rich text editing (not react-quill due to React 19 compatibility)
- **react-beautiful-dnd** for drag-and-drop (deprecated but functional)

## Deployment

The project includes Docker and Railway configurations. For Railway:
1. Connect GitHub repository
2. Add PostgreSQL service
3. Set environment variables in Railway dashboard
4. Database will auto-migrate on deployment