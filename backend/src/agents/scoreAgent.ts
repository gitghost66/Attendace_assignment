import { z } from 'zod';
import { callClaudeWithZod } from './llm';
import { ParsedResume } from './parseResume';
import { GapAnalysis } from './gapAnalysis';

export const ScoreSchema = z.object({
  categories: z.object({
    skillsMatch: z.number().min(0).max(100),
    experienceRelevance: z.number().min(0).max(100),
    projectDepth: z.number().min(0).max(100),
    educationFit: z.number().min(0).max(100),
    overallPresentation: z.number().min(0).max(100),
  }),
  overallScore: z.number().min(0).max(100),
  reasoning: z.string().describe("Brief explanation for the scores")
});

export type CandidateScore = z.infer<typeof ScoreSchema>;

export async function scoreCandidate(
  resume: ParsedResume,
  gapAnalysis: GapAnalysis
): Promise<CandidateScore> {
  const systemPrompt = `You are a strict, objective hiring manager. Score the candidate based on the resume data and gap analysis.
Scores should be between 0 and 100. Provide a rational explanation.
Output MUST be valid JSON adhering exactly to the requested schema.`;

  const userPrompt = `Resume Data:\n${JSON.stringify(resume, null, 2)}\n\nGap Analysis:\n${JSON.stringify(gapAnalysis, null, 2)}\n\nScore the candidate.`;

  return callClaudeWithZod(systemPrompt, userPrompt, ScoreSchema);
}
