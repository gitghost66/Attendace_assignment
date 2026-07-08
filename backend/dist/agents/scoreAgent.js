"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoreSchema = void 0;
exports.scoreCandidate = scoreCandidate;
const zod_1 = require("zod");
const llm_1 = require("./llm");
exports.ScoreSchema = zod_1.z.object({
    categories: zod_1.z.object({
        skillsMatch: zod_1.z.number().min(0).max(100),
        experienceRelevance: zod_1.z.number().min(0).max(100),
        projectDepth: zod_1.z.number().min(0).max(100),
        educationFit: zod_1.z.number().min(0).max(100),
        overallPresentation: zod_1.z.number().min(0).max(100),
    }),
    overallScore: zod_1.z.number().min(0).max(100),
    reasoning: zod_1.z.string().describe("Brief explanation for the scores")
});
async function scoreCandidate(resume, gapAnalysis) {
    const systemPrompt = `You are a strict, objective hiring manager. Score the candidate based on the resume data and gap analysis.
Scores should be between 0 and 100. Provide a rational explanation.
Output MUST be valid JSON adhering exactly to the requested schema.`;
    const userPrompt = `Resume Data:\n${JSON.stringify(resume, null, 2)}\n\nGap Analysis:\n${JSON.stringify(gapAnalysis, null, 2)}\n\nScore the candidate.`;
    return (0, llm_1.callClaudeWithZod)(systemPrompt, userPrompt, exports.ScoreSchema);
}
