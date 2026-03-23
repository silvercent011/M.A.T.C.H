import { defineHandler, HTTPError } from "nitro";
import { defineLazyEventHandler, getRouterParam, setHeader } from "nitro/h3";
import { JobService } from "~~/server/services/Jobs.service";
import { mdToPdf } from "md-to-pdf";

const CSS_CONTENT = `
body {
  font-family: Arial, Helvetica, sans-serif;
  font-size: 11pt;
  line-height: 1.5;
  color: #1a1a1a;
  max-width: 800px;
  margin: 0 auto;
}
h1 { font-size: 20pt; margin-bottom: 4px; }
h2 { font-size: 13pt; border-bottom: 1px solid #ccc; padding-bottom: 2px; margin-top: 18px; }
h3 { font-size: 11pt; margin-bottom: 2px; margin-top: 12px; }
p  { margin: 4px 0; }
ul { margin: 4px 0; padding-left: 18px; }
li { margin-bottom: 2px; }
hr { border: none; border-top: 1px solid #ddd; margin: 10px 0; }
code { background: #f5f5f5; padding: 1px 4px; border-radius: 3px; font-size: 10pt; }
a  { color: #1a1a1a; text-decoration: none; }
strong { font-weight: 600; }
em { font-style: italic; }
`;

export default defineLazyEventHandler(async () => {
  const __jobsService = new JobService();

  return defineHandler(async (event) => {
    const id = getRouterParam(event, "id");
    if (!id) {
      throw new HTTPError({ statusCode: 400, message: "ID is required" });
    }

    const job = await __jobsService.findById(parseInt(id));

    if (!job || !job.optimized_resume) {
      throw new HTTPError({ statusCode: 404, message: "Job or optimized resume not found" });
    }

    try {
      const pdfData = await mdToPdf(
        { content: job.optimized_resume },
        {
          pdf_options: {
            format: "A4",
            margin: { top: "18mm", bottom: "18mm", left: "18mm", right: "18mm" },
            printBackground: false,
          },
          css: CSS_CONTENT,
          launch_options: { args: ["--no-sandbox"] },
        },
      );

      // Return PDF buffer with correct headers
      setHeader(event, "Content-Type", "application/pdf");
      const sanitizedName = job.job_title.replace(/[^a-zA-Z0-9_-]/g, "_") + "_ATS";
      setHeader(event, "Content-Disposition", `attachment; filename="${sanitizedName}.pdf"`);

      return pdfData.content;
    } catch (error) {
      console.error("Failed to generate PDF:", error);
      throw new HTTPError({ statusCode: 500, message: "Failed to generate PDF" });
    }
  });
});
