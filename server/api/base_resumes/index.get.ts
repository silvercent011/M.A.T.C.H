import { defineHandler } from "nitro";
import { defineLazyEventHandler } from "nitro/h3";
import { BaseResumeService } from "~~/server/services/BaseResumes.service.ts";

export default defineLazyEventHandler(async () => {
  const __baseResumeService = new BaseResumeService();

  return defineHandler(async () => {
    const userId = "0";

    const resumes = await __baseResumeService.findByUserId(userId);

    return {
      resumes,
    };
  });
});
