# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup          # First-time setup: install deps + generate Prisma client + migrate DB
npm run dev            # Dev server with Turbopack (localhost:3000)
npm run build          # Production build
npm run lint           # ESLint
npm test               # Run Vitest tests
npm run db:reset       # Reset SQLite database (destructive)
PROXY_MODE=true npm run dev  # Dev server for AWS proxy deployment (assets served at /proxy/3000/)
```

To run a single test file: `npx vitest run src/path/to/test.ts`

## Environment

Create a `.env` file at the root. All keys are optional — the app falls back to mock generation:

```env
ANTHROPIC_API_KEY="..."           # Anthropic Claude API
AWS_BEARER_TOKEN_BEDROCK="..."    # AWS Bedrock (preferred over Anthropic if both set)
AWS_REGION="us-west-2"
PROXY_MODE=true                   # Enable for AWS/Nginx proxy deployments
```

## Architecture

**UIGen** is a Next.js 15 (app router) full-stack app that generates React components from natural language via Claude AI. Core flow: user types a prompt → `/api/chat` streams a Claude response → code blocks are extracted → files are written to the virtual file system → iframe preview re-renders.

### Key abstractions

**AI Provider** (`src/lib/provider.ts`): Wraps Anthropic, AWS Bedrock, and a Mock provider behind a unified interface using the Vercel AI SDK. Provider is selected at runtime based on env vars; mock generates static demo components when no API key is present.

**Virtual File System** (`src/lib/file-system.ts`): In-memory file tree (`VirtualFileSystem` class) that holds component files. Supports CRUD + text-editor-style operations (`replaceInFile`, `insertInFile`). Serializes to JSON for persistence in the `Project.data` DB column.

**File System Context** (`src/lib/contexts/file-system-context.tsx`): React context wrapping the virtual FS, provides file state to the whole app.

**Chat Context** (`src/lib/contexts/chat-context.tsx`): Uses `useChat` from `@ai-sdk/react`. After each AI response, parses code blocks and writes them to the virtual FS. Persists project state via server actions.

**API route** (`src/app/api/chat/route.ts`): Calls `streamText()` from the AI SDK with the configured provider. Saves updated project to Prisma on completion.

**Preview** (`src/components/preview/PreviewFrame.tsx`): Renders components in a sandboxed `<iframe>`. Uses Babel standalone for in-browser JSX compilation.

**Auth** (`src/lib/auth.ts`, `src/middleware.ts`): Custom JWT auth with bcrypt password hashing. Middleware protects `/api/projects/*` and `/api/filesystem/*`.

### Data model

```
User  (id, email, password)
  └─ Project  (id, name, userId, messages: JSON[], data: JSON VirtualFS snapshot)
```

Both `messages` and `data` are stored as JSON strings in SQLite columns.

### UI layout

`src/app/main-content.tsx` renders a three-panel resizable layout: **Chat** (35%) | **Preview/Code tabs** (65%). The Code tab shows Monaco Editor + FileTree; Preview tab shows the sandboxed iframe.
