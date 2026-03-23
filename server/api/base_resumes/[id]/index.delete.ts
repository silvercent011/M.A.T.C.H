import { defineHandler } from "nitro";
import { defineLazyEventHandler, getRouterParam } from "nitro/h3";
import { BaseResumeService } from "~~/server/services/BaseResumes.service.ts";

export default defineLazyEventHandler(async () => {
  const __baseResumeService = new BaseResumeService();

  return defineHandler(async (event) => {
    const id = getRouterParam(event, "id");

    await __baseResumeService.delete(parseInt(id!));

    return {};
  });
});
