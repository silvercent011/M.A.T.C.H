import { defineHandler } from "nitro";
import { defineLazyEventHandler, getRouterParam } from "nitro/h3";
import { JobService } from "~~/server/services/Jobs.service.ts";

export default defineLazyEventHandler(async () => {
  const __jobService = new JobService();

  return defineHandler(async (event) => {
    const id = getRouterParam(event, "id");

    const job = await __jobService.findById(parseInt(id!));

    return { job };
  });
});
