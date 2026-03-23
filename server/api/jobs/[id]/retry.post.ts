import { defineHandler } from "nitro";
import { defineLazyEventHandler, getRouterParam } from "nitro/h3";
import { JobService } from "~~/server/services/Jobs.service.ts";
import { BaseResumeService } from "~~/server/services/BaseResumes.service.ts";
import { runATSPipeline } from "~~/server/utils/agent.ts";

export default defineLazyEventHandler(async () => {
  const __jobService = new JobService();
  const __baseResumeService = new BaseResumeService();

  return defineHandler(async (event) => {
    const id = getRouterParam(event, "id");
    const job = await __jobService.findById(parseInt(id!));

    if (!job) {
      event.res.status = 404;
      return { error: "Job not found" };
    }

    if (job.status === "processing") {
      event.res.status = 409;
      return { error: "Job is already processing" };
    }

    // Reset to processing
    await __jobService.update(job.id, { status: "processing" });

    // Fire-and-forget the ATS pipeline again
    (async () => {
      try {
        const baseResume = await __baseResumeService.findById(job.base_resume_id);
        if (!baseResume) throw new Error("Base resume not found");

        const result = await runATSPipeline({
          jobDescription: job.job_description,
          currentResume: baseResume.resume_text,
          jobTitle: job.job_title,
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
        console.error(`ATS pipeline retry failed for job ${job.id}:`, err);
        await __jobService.update(job.id, { status: "error" });
      }
    })();

    const updatedJob = await __jobService.findById(job.id);
    return { job: updatedJob };
  });
});
