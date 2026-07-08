import { z } from 'zod';
import { callClaudeWithZod } from './llm';
import { ParsedResume } from './parseResume';
import { JobRequirements } from './extractRequirements';

export const GapAnalysisSchema = z.object({
  analysis: z.array(z.object({
    requirement: z.string(),
    type: z.enum(['must-have', 'nice-to-have']),
    status: z.enum(['Met', 'Partial', 'Missing']),
    evidence: z.string().describe("Evidence from resume supporting the status")
  }))
});

export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;

export async function performGapAnalysis(
  resume: ParsedResume,
  requirements: JobRequirements
): Promise<GapAnalysis> {
  const systemPrompt = `You are an expert technical assessor. Compare the parsed resume data against the job requirements.
Output MUST be valid JSON adhering exactly to the requested schema.`;

  const userPrompt = `Resume Data:\n${JSON.stringify(resume, null, 2)}\n\nRequirements:\n${JSON.stringify(requirements, null, 2)}\n\nPerform a gap analysis for each requirement.`;

  return callClaudeWithZod(systemPrompt, userPrompt, GapAnalysisSchema);
}
