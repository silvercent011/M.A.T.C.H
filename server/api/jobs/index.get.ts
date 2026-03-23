import { defineHandler } from "nitro";
import { defineLazyEventHandler, getQuery } from "nitro/h3";
import { JobService } from "~~/server/services/Jobs.service.ts";

export default defineLazyEventHandler(async () => {
  const __jobService = new JobService();

  return defineHandler(async (event) => {
    const query = getQuery(event);
    const baseResumeId = query.base_resume_id ? parseInt(query.base_resume_id as string) : undefined;

    const jobs = await __jobService.findAll(baseResumeId);

    return { jobs };
  });
});
