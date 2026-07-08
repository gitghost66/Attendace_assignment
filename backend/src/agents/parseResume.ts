import { z } from 'zod';
import { callClaudeWithZod } from './llm';

export const ResumeSchema = z.object({
  skills: z.array(z.string()).describe("List of technical and soft skills"),
  experience: z.array(z.object({
    role: z.string(),
    company: z.string(),
    years: z.number().describe("Estimated years of experience in this role"),
    description: z.string()
  })),
  education: z.array(z.object({
    degree: z.string(),
    institution: z.string(),
    year: z.string().optional()
  })),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string(),
    technologies: z.array(z.string())
  })).optional(),
  certifications: z.array(z.string()).optional()
});

export type ParsedResume = z.infer<typeof ResumeSchema>;

export async function parseResume(resumeText: string): Promise<ParsedResume> {
  const systemPrompt = `You are an expert HR parser. Your job is to extract structured data from the provided resume text.
Output MUST be valid JSON adhering exactly to the requested schema. Do not add any text outside the JSON block.`;

  const userPrompt = `Please parse the following resume:\n\n${resumeText}\n\nReturn the JSON structure matching the schema.`;

  return callClaudeWithZod(systemPrompt, userPrompt, ResumeSchema);
}
