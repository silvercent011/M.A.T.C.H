**Important:** Keep `AGENTS.md` updated.

This project is based on [Nitro](https://nitro.build) v3, [h3](https://h3.dev/), [Vite](https://vite.dev/) and [rolldown](https://rolldown.rs/).

## Project Structure

`app/` is the frontend with `main.ts` as entry and file-based pages under `app/pages/`. `app/pages/index.vue` is the dashboard-style home page and should remain the primary overview entry. Key frontend subdirs currently in use are `components/`, `assets/`, and `lib/`. `server/` currently contains `api/` (/api prefixed handlers), `plugins/`, `services/`, and `utils/`. `public/` holds static assets (copied, not bundled). Config files: `vite.config.ts` (loads `nitro/vite`, Vue, Tailwind and file-based router plugins), `nitro.config.ts` (serverDir and database config), `tsconfig.json` (extends `nitro/tsconfig`, `~/*`, `@/*`, and `~~/*` path aliases).

## Conventions

- Path aliases: `~/*` and `@/*` map to `app/*`; `~~/*` maps to project root
- Use explicit `.ts` extensions where applicable
- Route handlers use `defineHandler()` from `nitro`
- Route file patterns: `[param]` for dynamic, `[...slug]` for catch-all, `.get.ts`/`.post.ts` for method-specific, `(group)/` ignored in path
- Environment-specific routes: `.dev.ts` / `.prod.ts` suffixes

## Nitro Usage

@node_modules/nitro/skills/nitro/docs/TOC.md

Use docs from `./node_modules/nitro/skills/nitro/docs/` and prefer over fetching from web.

**Imports from `nitro`:**

- `defineHandler(handler)` — Route handler with type inference
- `definePlugin(plugin)` — Server lifecycle plugin (hooks: `request`, `response`, `error`, `close`)
- `defineCachedHandler(handler, opts)` / `defineCachedFunction(fn, opts)` — Response/function caching (GET/HEAD only)
- `defineTask({ meta, run })` — Background tasks (requires `experimental: { tasks: true }`)

**Imports from `nitro/*`:**

- `useStorage(namespace?)` from `nitro/storage` — KV storage (`getItem`, `setItem`, `removeItem`, `getKeys`)
- `useDatabase()` from `nitro/database` — SQL via tagged template: `` db.sql`SELECT ...` `` (requires `experimental: { database: true }`)
- `runTask(name, { payload })` from `nitro/task` — Programmatic task execution

**Request Lifecycle:**

1. Plugins `request` hook → 2. Static assets → 3. Route rules → 4. Global middleware → 5. Route-scoped middleware → 6. Route handler → 7. Server entry fallback → 8. Renderer (SPA/SSR) → 9. Plugins `response` hook

**Config (`nitro.config.ts`):**

- `serverDir` — currently points to `./server`
- `experimental.database` — enabled in this project
- `database.default` — uses `better-sqlite3` with database name `db`
- `routeRules` / `storage` / `prerender` / `traceDeps` — supported by Nitro when needed, but not currently configured here

**`import.meta.*` (server-side flags):** `dev`, `preset`, `prerender`, `nitro`, `server`, `client`, `baseURL`

**Nitro v3 / H3 v2 new conventions:** `nitropack/runtime/*` → `nitro/*` (e.g. `nitro/storage`, `nitro/task`, `nitro/types`); all h3 imports from `nitro/h3`; `eventHandler()`/`defineEventHandler()` → `defineHandler()`; `createError()`/`H3Error` → `HTTPError`; `event.path` → `event.url.pathname`; `event.web` → `event.req` (native `Request`); body via `event.req.json()`/`.text()`/`.formData()`; headers via `event.req.headers.get()`/`event.res.headers.set()`; status via `event.res.status`; always `return` values (`return redirect(loc, code)`); `sendError()` → `throw HTTPError`; `sendNoContent()` → `return noContent()`; `useAppConfig()` removed.

## ATS Pipeline (`server/utils/agent.ts`)

`runATSPipeline` accepts `currentResume` as plain text or HTML. If the input is detected as HTML (by `<!DOCTYPE html>`, `<html` root, or ≥3 structural HTML tags), `stripHtml()` extracts readable text using a state-machine parser before passing to the AI. The rewrite prompt template includes an `## Idiomas` section for language proficiency.
