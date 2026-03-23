import { definePlugin } from "nitro";
import { useDatabase } from "nitro/database";

export default definePlugin(async () => {
  const db = useDatabase();

  await db.sql`PRAGMA foreign_keys = ON;`;

  await db.sql`
    CREATE TABLE IF NOT EXISTS base_resumes (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL,
      resume_name TEXT NOT NULL,
      resume_text TEXT NOT NULL,
      created_at  TEXT DEFAULT (datetime('now')),
      updated_at  TEXT DEFAULT (datetime('now'))
    );
  `;

  await db.sql`CREATE INDEX IF NOT EXISTS idx_base_resumes_user ON base_resumes(user_id);`;

  await db.sql`
    CREATE TABLE IF NOT EXISTS jobs (
      id                   INTEGER PRIMARY KEY AUTOINCREMENT,
      base_resume_id       INTEGER NOT NULL REFERENCES base_resumes(id) ON DELETE CASCADE,
      job_title            TEXT NOT NULL,
      job_description      TEXT NOT NULL,
      job_requirements_map TEXT,
      audit_report         TEXT,
      optimized_resume     TEXT,
      score_total          INTEGER,
      score_breakdown      TEXT,
      refinement_count     INTEGER DEFAULT 0,
      status               TEXT NOT NULL DEFAULT 'pending',
      created_at           TEXT DEFAULT (datetime('now')),
      updated_at           TEXT DEFAULT (datetime('now'))
    );
  `;

  await db.sql`CREATE INDEX IF NOT EXISTS idx_jobs_base_resume ON jobs(base_resume_id);`;
  await db.sql`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);`;

  await db.sql`
    CREATE TABLE IF NOT EXISTS resume_versions (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id           INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
      version          INTEGER NOT NULL,
      optimized_resume TEXT NOT NULL,
      score_total      INTEGER,
      created_at       TEXT DEFAULT (datetime('now'))
    );
  `;

  await db.sql`CREATE INDEX IF NOT EXISTS idx_resume_versions_job ON resume_versions(job_id);`;

  await db.sql`
    CREATE TRIGGER IF NOT EXISTS trg_base_resumes_updated
    AFTER UPDATE ON base_resumes
    FOR EACH ROW
    BEGIN
      UPDATE base_resumes SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `;

  await db.sql`
    CREATE TRIGGER IF NOT EXISTS trg_jobs_updated
    AFTER UPDATE ON jobs
    FOR EACH ROW
    BEGIN
      UPDATE jobs SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `;
});
