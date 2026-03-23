import { useDatabase } from "nitro/database";

export interface Job {
  id: number;
  base_resume_id: number;
  job_title: string;
  job_description: string;
  job_requirements_map: string | null;
  audit_report: string | null;
  optimized_resume: string | null;
  score_total: number | null;
  score_breakdown: string | null;
  refinement_count: number;
  status: "pending" | "processing" | "done" | "error";
  created_at: string;
  updated_at: string;
}

export interface ResumeVersion {
  id: number;
  job_id: number;
  version: number;
  optimized_resume: string;
  score_total: number | null;
  created_at: string;
}

export type CreateJobInput = Pick<Job, "base_resume_id" | "job_title" | "job_description">;
export type UpdateJobInput = Partial<
  Pick<
    Job,
    | "job_title"
    | "job_description"
    | "job_requirements_map"
    | "audit_report"
    | "optimized_resume"
    | "score_total"
    | "score_breakdown"
    | "refinement_count"
    | "status"
  >
>;

export class JobService {
  async create(input: CreateJobInput): Promise<Job> {
    const db = useDatabase();

    const result = await db.sql`
      INSERT INTO jobs (base_resume_id, job_title, job_description, status)
      VALUES (${input.base_resume_id}, ${input.job_title}, ${input.job_description}, 'processing')
    `;

    return this.findById(result.lastInsertRowid as number) as Promise<Job>;
  }

  async findById(id: number): Promise<Job | null> {
    const db = useDatabase();

    const result = await db.sql`
      SELECT * FROM jobs WHERE id = ${id}
    `;

    return (result.rows?.[0] as unknown as Job) ?? null;
  }

  async findAll(baseResumeId?: number): Promise<Job[]> {
    const db = useDatabase();

    const result = baseResumeId
      ? await db.sql`
          SELECT * FROM jobs
          WHERE base_resume_id = ${baseResumeId}
          ORDER BY updated_at DESC
        `
      : await db.sql`
          SELECT * FROM jobs
          ORDER BY updated_at DESC
        `;

    return result.rows as unknown as Job[];
  }

  async update(id: number, input: UpdateJobInput): Promise<Job | null> {
    const db = useDatabase();
    const fields = Object.entries(input).filter(([, v]) => v !== undefined);

    if (fields.length === 0) return this.findById(id);

    // Build individual SET expressions to avoid dynamic SQL interpolation issues
    for (const [key, value] of fields) {
      if (key === "job_title") {
        await db.sql`UPDATE jobs SET job_title = ${value} WHERE id = ${id}`;
      } else if (key === "job_description") {
        await db.sql`UPDATE jobs SET job_description = ${value} WHERE id = ${id}`;
      } else if (key === "job_requirements_map") {
        await db.sql`UPDATE jobs SET job_requirements_map = ${value} WHERE id = ${id}`;
      } else if (key === "audit_report") {
        await db.sql`UPDATE jobs SET audit_report = ${value} WHERE id = ${id}`;
      } else if (key === "optimized_resume") {
        await db.sql`UPDATE jobs SET optimized_resume = ${value} WHERE id = ${id}`;
      } else if (key === "score_total") {
        await db.sql`UPDATE jobs SET score_total = ${value} WHERE id = ${id}`;
      } else if (key === "score_breakdown") {
        await db.sql`UPDATE jobs SET score_breakdown = ${value} WHERE id = ${id}`;
      } else if (key === "refinement_count") {
        await db.sql`UPDATE jobs SET refinement_count = ${value} WHERE id = ${id}`;
      } else if (key === "status") {
        await db.sql`UPDATE jobs SET status = ${value} WHERE id = ${id}`;
      }
    }

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const db = useDatabase();

    const result = await db.sql`
      DELETE FROM jobs WHERE id = ${id}
    `;

    return (result.changes ?? 0) > 0;
  }

  async saveVersion(
    jobId: number,
    optimizedResume: string,
    scoreTotal: number | null,
  ): Promise<ResumeVersion> {
    const db = useDatabase();

    const countResult = await db.sql`
      SELECT COUNT(*) as cnt FROM resume_versions WHERE job_id = ${jobId}
    `;
    const nextVersion = ((countResult.rows?.[0] as any)?.cnt ?? 0) + 1;

    const ins = await db.sql`
      INSERT INTO resume_versions (job_id, version, optimized_resume, score_total)
      VALUES (${jobId}, ${nextVersion}, ${optimizedResume}, ${scoreTotal})
    `;

    const vResult = await db.sql`
      SELECT * FROM resume_versions WHERE id = ${ins.lastInsertRowid}
    `;

    return vResult.rows?.[0] as unknown as ResumeVersion;
  }

  async findVersions(jobId: number): Promise<ResumeVersion[]> {
    const db = useDatabase();

    const result = await db.sql`
      SELECT * FROM resume_versions WHERE job_id = ${jobId} ORDER BY version ASC
    `;

    return result.rows as unknown as ResumeVersion[];
  }
}
