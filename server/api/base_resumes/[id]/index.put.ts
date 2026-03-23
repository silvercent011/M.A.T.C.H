import { defineHandler } from "nitro";
import { defineLazyEventHandler, readBody, getRouterParam } from "nitro/h3";
import { BaseResumeService } from "~~/server/services/BaseResumes.service.ts";

export default defineLazyEventHandler(async () => {
  const __baseResumeService = new BaseResumeService();

  return defineHandler(async (event) => {
    const id = getRouterParam(event, "id");
    const body: any = await readBody(event);

    const resume = await __baseResumeService.update(parseInt(id!), {
      resume_text: body.resume_text,
      resume_name: body.resume_name,
    });

    return {
      resume,
    };
  });
});
