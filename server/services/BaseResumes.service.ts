import { useDatabase } from "nitro/database";

export interface BaseResume {
  id: number;
  user_id: string;
  resume_name: string;
  resume_text: string;
  created_at: string;
  updated_at: string;
}

export type CreateBaseResumeInput = Pick<BaseResume, "user_id" | "resume_name" | "resume_text">;
export type UpdateBaseResumeInput = Partial<Pick<BaseResume, "resume_name" | "resume_text">>;

export class BaseResumeService {
  async create(input: CreateBaseResumeInput): Promise<BaseResume> {
    const db = useDatabase();

    const result = await db.sql`
      INSERT INTO base_resumes (user_id, resume_name, resume_text)
      VALUES (${input.user_id}, ${input.resume_name}, ${input.resume_text})
    `;

    return this.findById(result.lastInsertRowid as number) as Promise<BaseResume>;
  }

  async findById(id: number): Promise<BaseResume | null> {
    const db = useDatabase();

    const result = await db.sql`
      SELECT * FROM base_resumes WHERE id = ${id}
    `;

    return result.rows?.[0] as unknown as BaseResume;
  }
  async findByUserId(userId: string): Promise<BaseResume[]> {
    const db = useDatabase();

    const result = await db.sql`
      SELECT * FROM base_resumes
      WHERE user_id = ${userId}
      ORDER BY updated_at DESC
    `;

    return result.rows as unknown as BaseResume[];
  }

  async update(id: number, input: UpdateBaseResumeInput): Promise<BaseResume | null> {
    const db = useDatabase();

    if (input.resume_name !== undefined && input.resume_text !== undefined) {
      await db.sql`
        UPDATE base_resumes
        SET resume_name = ${input.resume_name}, resume_text = ${input.resume_text}
        WHERE id = ${id}
      `;
    } else if (input.resume_name !== undefined) {
      await db.sql`
        UPDATE base_resumes SET resume_name = ${input.resume_name} WHERE id = ${id}
      `;
    } else if (input.resume_text !== undefined) {
      await db.sql`
        UPDATE base_resumes SET resume_text = ${input.resume_text} WHERE id = ${id}
      `;
    }

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const db = useDatabase();

    const result = await db.sql`
      DELETE FROM base_resumes WHERE id = ${id}
    `;

    return (result.changes ?? 0) > 0;
  }
}
