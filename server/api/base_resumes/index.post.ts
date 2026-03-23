import { defineHandler } from "nitro";
import { defineLazyEventHandler, readBody } from "nitro/h3";
import { BaseResumeService } from "~/server/services/BaseResumes.service";

export default defineLazyEventHandler(async () => {
  const __baseResumeService = new BaseResumeService();

  return defineHandler(async (event) => {
    const userId = "0";

    const body: any = await readBody(event);

    const resume = await __baseResumeService.create({
      user_id: userId,
      resume_name: body.resume_name,
      resume_text: body.resume_text,
    });

    return {
      resume,
    };
  });
});
