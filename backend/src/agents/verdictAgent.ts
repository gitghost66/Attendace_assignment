import { z } from 'zod';
import { callClaudeWithZod } from './llm';
import { CandidateScore } from './scoreAgent';
import { GapAnalysis } from './gapAnalysis';

export const VerdictSchema = z.object({
  decision: z.enum(['Hired', 'Not Hired', 'Borderline - Interview Recommended']),
  justification: z.string().describe("Concise justification for the decision"),
  improvementSuggestions: z.array(z.string()).describe("3-5 specific suggestions for the candidate if not a clean hire")
});

export type Verdict = z.infer<typeof VerdictSchema>;

export async function generateVerdict(
  score: CandidateScore,
  gapAnalysis: GapAnalysis
): Promise<Verdict> {
  const systemPrompt = `You are the final hiring authority. Make a decisive verdict based on the candidate's score and gap analysis.
Output MUST be valid JSON adhering exactly to the requested schema.`;

  const userPrompt = `Candidate Score:\n${JSON.stringify(score, null, 2)}\n\nGap Analysis:\n${JSON.stringify(gapAnalysis, null, 2)}\n\nProvide the final verdict.`;

  return callClaudeWithZod(systemPrompt, userPrompt, VerdictSchema);
}
