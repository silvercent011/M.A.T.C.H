import { defineHandler } from "nitro";
import { defineLazyEventHandler, readBody } from "nitro/h3";
import { JobService } from "~~/server/services/Jobs.service.ts";
import { BaseResumeService } from "~~/server/services/BaseResumes.service.ts";
import { runATSPipeline } from "~~/server/utils/agent.ts";

export default defineLazyEventHandler(async () => {
  const __jobService = new JobService();
  const __baseResumeService = new BaseResumeService();

  return defineHandler(async (event) => {
    const body: any = await readBody(event);

    const { base_resume_id, job_title, job_description } = body;

    // Create the job row immediately with status 'processing'
    const job = await __jobService.create({
      base_resume_id: parseInt(base_resume_id),
      job_title,
      job_description,
    });

    // Fire-and-forget the ATS pipeline
    (async () => {
      try {
        const baseResume = await __baseResumeService.findById(parseInt(base_resume_id));
        if (!baseResume) throw new Error("Base resume not found");

        const result = await runATSPipeline({
          jobDescription: job_description,
          currentResume: baseResume.resume_text,
          jobTitle: job_title,
          scoreThreshold: 90,
          maxRefinements: 2,
        });

        await __jobService.update(job.id, {
          job_requirements_map: result.jobRequirementsMap,
          audit_report: result.auditReport,
          optimized_resume: result.optimizedResume,
          score_total: result.finalScore,
          score_breakdown: result.scoreReport,
          refinement_count: result.refinements,
          status: "done",
        });

        await __jobService.saveVersion(job.id, result.optimizedResume, result.finalScore);
      } catch (err) {
        console.error(`ATS pipeline failed for job ${job.id}:`, err);
        await __jobService.update(job.id, { status: "error" });
      }
    })();

    return { job };
  });
});
