# dakoku — Agent Guidelines & Coding Rules

**dakoku** (打刻/タイムクロッキング) — A minimalist time/attendance tracking application featuring Electron desktop UI with full-stack backend (Hono + Drizzle + Turso/SQLite).

> **Note**: [dakokuサーバー化要件.md](dakokuサーバー化要件.md) は Supabase 前提で作成されており、現在はTursoに移行しています。詳細要件はリファレンスとしてご参照ください。

---

## Quick Reference: Build & Run Commands

### Root (`pnpm` from project root)
```bash
pnpm dev              # Run desktop + server concurrently
pnpm build            # Build server, then desktop
pnpm db:generate      # Generate Drizzle migrations
pnpm db:push          # Push migrations to DB
pnpm db:studio        # Open Drizzle Studio (interactive DB browser)
```

### Desktop
```bash
pnpm -C desktop dev           # Electron dev mode (watch)
pnpm -C desktop build         # Build with type check
pnpm -C desktop build:win     # Windows executable
pnpm -C desktop typecheck     # Type check only
```

### Server
```bash
pnpm -C server dev            # Watch mode
pnpm -C server build          # Production build (tsup → dist/)
pnpm -C server start          # Build + run
```

---

## Architecture Overview

### Monorepo Structure
```
dakoku/
├── desktop/                   # Electron desktop app (React + Vite)
│   ├── src/main/             # Electron main process
│   │   ├── index.ts          # Bootstrap
│   │   ├── http.ts           # HTTP helper
│   │   ├── calendar.ts, dayDetail.ts  # IPC handlers
│   │   ├── store.ts          # Electron store
│   │   └── api/              # Server API calls
│   │       ├── mainApi.ts, calendarApi.ts, dayDetailApi.ts
│   ├── src/preload/          # Preload script (context bridge)
│   │   └── index.ts
│   └── src/renderer/         # Renderer process (React UI)
│       ├── src/modules/      # Jotai state management
│       │   ├── store.ts      # Regular atoms
│       │   └── promiseStore.ts # Promise atoms (atomWithQuery, etc.)
│       └── src/components/   # React component tree
│           ├── calendar/, dayDetail/, timeForm/
│
└── server/                    # Backend: Hono + Drizzle + Turso
    ├── src/
    │   ├── index.ts          # Bootstrap
    │   ├── http.ts           # Hono app
    │   ├── auth/
    │   │   └── betterAuth.ts # Auth config
    │   ├── db/
    │   │   ├── Model.ts      # Base ORM class (extends Drizzle)
    │   │   ├── client.ts     # Turso/libsql client
    │   │   ├── schema.ts     # Drizzle schema
    │   │   ├── bootstrap.ts  # DB init
    │   │   ├── models/       # ORM models (User, Job, WorkTime, CurrentJob)
    │   │   └── repositories/ # Complex queries
    │   └── routes/           # API endpoints
    │       ├── auth.ts, main.ts, calendar.ts
    └── drizzle.config.ts
```

### Data Flow
1. **Desktop Main Process** → calls API functions → HTTP requests to Server
2. **Server Routes** → queries DB via Model classes → returns `camelCase` Data types
3. **Preload Script** → exposes initial data at app startup
4. **Renderer React** → uses Jotai atoms for state, prioritizes initial data

---

## Coding Rules

### Universal Rules (Server + Desktop)

#### Time & Date Handling
- ✅ **ALWAYS use `dayjs`** for all time operations — never use `Date`
- Store timestamps as `epochMillis` (milliseconds since Unix epoch) or `ISO 8601` strings
- Handle timezone explicitly: assume `Asia/Tokyo` for non-UTC calculations

#### Code Style & Linting
- 🔴 **REQUIRED**: Run `eslint --fix` after modifying `.ts`, `.tsx`, `.mjs`, `.js`, `.jsx` files
  - Add this to your commit workflow automatically
- Use arrow functions (`const fn = () => {}`) by default
- Use `function` declarations **only** for:
  - Function overloads (TypeScript)
  - Generic functions where type inference requires explicit declaration
- All variable/function names use `camelCase`; table names and SQL identifiers use `snake_case`

---

### Server-Specific Rules

#### Database Operations & ORM Pattern

**Location**: `server/src/db/`  
**Database**: Turso (libsql) — SQLite互換の完全型のクラウドデータベース

Every database table gets a Model class:
- 📍 All models go in `server/src/db/models/`
- ✅ **Must extend** `server/src/db/Model.ts` as base class
- ✅ **Must define** a `namespace.Data` type (TypeScript namespace inside same file as class)
- ✅ **Data = Table schema** with all column names converted to `camelCase`

```typescript
// Example: User model for "users" table
export class User extends Model<User.Data> {
  protected static _tableName = 'users';
  
  // Getters for each column
  get id() { return this._data.id; }
  get email() { return this._data.email; }
  get createdAt() { return this._data.createdAt; }
}

export namespace User {
  export type Data = {
    id: string;
    email: string;
    createdAt: number;  // epochMillis
  };
}
```

**Rules:**
- 🚫 **NEVER** import Turso/libsql client directly except in `server/src/db/client.ts`
- ✅ **ONLY** perform DB operations through Model classes
- ✅ Return data from routes as `YourModel.Data` (camelCase, matches namespace definition)
- 🚫 Minimize raw SQL; keep DB-specific logic confined to `Model.ts` and repositories

#### API Response Format
- All external data returned as `Data` types (camelCase keys)
- Status codes: `200` (success), `400` (bad request), `401` (auth), `404` (not found), `500` (server error)
  
For complex queries, use repository classes:
- 📍 `server/src/db/repositories/` — QueryBuilder logic belongs here
- Each repository handles one entity (e.g., `WorkTimeRepository`)

---

### Desktop-Specific Rules (Electron + React)

#### State Management (Jotai)

Where state lives:
- 📍 **Regular atoms** (non-`Promise`) → `desktop/src/renderer/src/modules/store.ts`
- 📍 **Promise atoms** (`atomWithQuery`, `atomWithMutation`) → `desktop/src/renderer/src/modules/promiseStore.ts`

```typescript
// store.ts: Regular atoms
export const selectedJobAtom = atom<Job | null>(null);

// promiseStore.ts: Promise-based atoms (Query/Mutation)
export const workTimesAtom = atomWithQuery(
  () => ({ queryKey: 'workTimes' }),
  () => api.getWorkTimes()
);
```

#### Data Flow: Initial Data on Startup
1. **Main Process** (before any window is shown)
   - Fetch initial data from server (e.g., jobs list, today's work times)
   - Pass data via `preload` context bridge
2. **Preload Script** (`src/preload/index.ts`)
   - Expose data to renderer: `window.__INITIAL_DATA__ = { jobs, workTimes, ... }`
3. **Renderer (React Component)**
   - Use initial data immediately in render (don't show loading state)
   - Only refetch when user triggers action (e.g., "Refresh", "Add Job")
   - ✅ Prioritize initial data over `useEffect` / `atomWithQuery` fetches

**Anti-pattern:**
```typescript
// ❌ BAD: Always shows loading spinner, defeats preload purpose
const [workTimes, setWorkTimes] = useAtom(workTimesAtom);  // Triggered on mount
```

**Correct pattern:**
```typescript
// ✅ GOOD: Use initial data, refetch only on demand
const initialWorkTimes = window.__INITIAL_DATA__.workTimes;
const refetch = async () => {
  // User triggered refresh
};
```

#### Component Organization
- 🎨 UI components → `src/components/{feature}/`
- 🪝 Feature hooks → `src/components/{feature}/hooks/`
- 🔧 Utility functions → `src/commonUtility/utils.ts` or feature-specific
- 📐 Responsive design via MUI + Material-UI Grid

---

## DB Schema Reference

Tables (詳細は [dakokuサーバー化要件.md](dakokuサーバー化要件.md) の Supabase DB設計 を参照):
- `users` — ユーザー情報 (id, email, created_at)
- `jobs` — ジョブ定義 (id, user_id, name, color, is_deleted, created_at)
- `work_times` — 就業時間記録 (id, user_id, job_id, year, month, date, index, acted_at, status)
- `current_jobs` — 現在の就業状態 (user_id, job_id, unique constraint on user_id)

**Database**: Turso（libsql) + SQLiteダイアレクト。環境変数: `DATABASE_URL` (Turso URL)、`DATABASE_AUTH_TOKEN` (認証トークン)

---

## Common Workflows

### Adding a New Database Model
1. Define schema in `server/src/db/schema.ts` (Drizzle table)
2. Create model class in `server/src/db/models/YourModel.ts`
3. Define `namespace.Data` with `camelCase` properties
4. Add getters for each property
5. Create repository in `server/src/db/repositories/YourRepository.ts` if query logic is complex
6. Run `pnpm db:generate` → `pnpm db:push`
7. Run `eslint --fix` on all modified files

### Adding a New API Route
1. Create route file in `server/src/routes/`
2. Import necessary models
3. Use models for all DB operations
4. Return data as `Model.Data` type
5. Register route in `server/src/http.ts`
6. Update desktop API calls in `desktop/src/main/api/`

### Fetching Initial Data in Desktop
1. Add fetch logic to `desktop/src/main/{feature}.ts`
2. Pass result via preload: `preload.exposeInMainWorld('initialData', { ... })`
3. In renderer component, use `window.__INITIAL_DATA__`
4. For re-fetch, call Jotai atom or manual `fetch()`

---

## Anti-Patterns to Avoid

❌ **Supabase client in routes** — Direct DB access loses abstraction, breaks when DB changes  
✅ **Always use Models**

❌ **Loading spinners on initial render** — Initial data defeats this  
✅ **Prioritize preload data, refetch on user action**

❌ **`Date` object** — Timezone bugs, inconsistent serialization  
✅ **Use `dayjs`**

❌ **`function` declarations everywhere** — Inconsistent style  
✅ **Default to arrow functions**

❌ **Raw SQL in routes** — Logic scattered, hard to maintain  
✅ **Repository classes for complex queries**

❌ **Forgetting `eslint --fix`** — CI will fail  
✅ **Lint after every change**
