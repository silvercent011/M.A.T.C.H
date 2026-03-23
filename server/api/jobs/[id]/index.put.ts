import { defineHandler } from "nitro";
import { defineLazyEventHandler, readBody, getRouterParam } from "nitro/h3";
import { JobService } from "~~/server/services/Jobs.service.ts";

export default defineLazyEventHandler(async () => {
  const __jobService = new JobService();

  return defineHandler(async (event) => {
    const id = getRouterParam(event, "id");
    const body: any = await readBody(event);

    const job = await __jobService.update(parseInt(id!), {
      job_title: body.job_title,
      job_description: body.job_description,
    });

    return { job };
  });
});
