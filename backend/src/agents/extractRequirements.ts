import { z } from 'zod';
import { callClaudeWithZod } from './llm';

export const RequirementsSchema = z.object({
  mustHaves: z.array(z.string()).describe("Absolute requirements (e.g. 5+ years of React, CS Degree)"),
  niceToHaves: z.array(z.string()).describe("Preferred but not strictly required skills or experiences"),
});

export type JobRequirements = z.infer<typeof RequirementsSchema>;

export async function extractRequirements(jobDescription: string): Promise<JobRequirements> {
  const systemPrompt = `You are an expert technical recruiter. Analyze the job description and extract the core requirements into must-haves and nice-to-haves. Output MUST be valid JSON adhering exactly to the requested schema.`;

  const userPrompt = `Job Description:\n\n${jobDescription}\n\nExtract requirements into JSON.`;

  return callClaudeWithZod(systemPrompt, userPrompt, RequirementsSchema);
}
