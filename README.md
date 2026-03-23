# M.A.T.C.H

Markdown ATS Tailoring & Career Handler.

M.A.T.C.H is an application for storing base resumes in Markdown, matching them against job descriptions, and generating ATS-optimized versions with analysis, audit output, scoring, and PDF export.

## Project scope

This is a web application, but it is designed first to run locally on a developer's machine. The default setup uses local-oriented tooling such as a local SQLite database and developer-managed AI credentials. You are free to adapt the project to your own environment, replace local components with hosted services, or integrate a different database, model provider, or deployment approach if that better fits your use case.

## What the application does

- Stores base resumes in Markdown
- Stores job postings and links each one to a base resume
- Runs an ATS optimization pipeline with an LLM through Anthropic + LangChain
- Generates:
  - a structured job requirements map
  - an audit report
  - an ATS-optimized resume
  - a compatibility score
  - version history for optimized resumes
- Exports both base and optimized resumes as Markdown or PDF

## Stack

- Nitro v3 on the backend
- Vite for dev and build
- Vue 3 on the frontend
- Vue Router with file-based routing in `app/pages`
- Tailwind CSS v4
- SQLite via `better-sqlite3` and `nitro/database`
- LangChain + Anthropic for the optimization pipeline

## Requirements

- Node.js 20+
- pnpm
- An Anthropic API key

## Setup

1. Install dependencies:

```bash
pnpm install
```

2. Create the environment file:

```bash
cp .env.example .env
```

3. Set the required variable:

```env
ANTHROPIC_API_KEY="your-key"
```

## Run in development

```bash
pnpm dev
```

The app runs with Vite + Nitro. SQLite migrations are executed automatically by the plugin [`server/plugins/migration.ts`](/home/alex/tklsn/M.A.T.C.H/server/plugins/migration.ts).

## Build and preview

```bash
pnpm build
pnpm preview
```

## Available scripts

- `pnpm dev`: run locally in development mode
- `pnpm build`: type-check and create a production build
- `pnpm preview`: preview the production build locally
- `pnpm lint`: run Oxlint
- `pnpm lint:fix`: apply automatic lint fixes
- `pnpm fmt`: run Oxfmt
- `pnpm fmt:check`: check formatting

## Usage flow

1. Create a base resume in Markdown from the resumes area.
2. Create a job by providing title, description, optional link, and the base resume to use.
3. The backend creates the job and starts the ATS pipeline.
4. When processing finishes, the job view shows:
   - the optimized resume
   - extracted requirements
   - the audit report
   - the score
   - the final output
5. Export the result as Markdown or PDF.

## Project structure

```text
app/
  components/    UI components
  lib/           Frontend utilities
  pages/         File-based routes
  assets/        CSS and processed frontend assets
server/
  api/           HTTP endpoints
  plugins/       Nitro startup plugins
  services/      Data access layer
  utils/         LLM integration
public/          Static files
refs/            Local references and auxiliary files
```

## Database

The project uses SQLite with automatic migration on startup. At the moment there are three main tables:

- `base_resumes`
- `jobs`
- `resume_versions`

The database is configured in [`nitro.config.ts`](/home/alex/tklsn/M.A.T.C.H/nitro.config.ts) with the `better-sqlite3` connector.

## Main API

- `GET /api/base_resumes`
- `POST /api/base_resumes`
- `GET /api/base_resumes/:id`
- `PUT /api/base_resumes/:id`
- `DELETE /api/base_resumes/:id`
- `GET /api/base_resumes/:id/pdf`
- `GET /api/jobs`
- `POST /api/jobs`
- `GET /api/jobs/:id`
- `PUT /api/jobs/:id`
- `DELETE /api/jobs/:id`
- `POST /api/jobs/:id/retry`
- `GET /api/jobs/:id/pdf`

## Current limitations

- Authentication is not implemented yet; resumes are currently fetched with a fixed `user_id` in the backend.
- There is no automated test suite configured in the repository right now.
- PDF generation depends on the Markdown content being compatible with the `md-to-pdf` converter.

## Development notes

- The main app alias is `~/*`, which points to `app/*`
- `@/*` also points to `app/*`
- `~~/*` points to the project root
- The frontend uses typed routes generated from `app/pages`

## Deploy

Because the project is built on Nitro, deployment targets depend on the selected preset and infrastructure. Use the local Nitro documentation in `node_modules/nitro/skills/nitro/docs/` and adjust the preset for the target environment.
