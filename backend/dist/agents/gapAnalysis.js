"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GapAnalysisSchema = void 0;
exports.performGapAnalysis = performGapAnalysis;
const zod_1 = require("zod");
const llm_1 = require("./llm");
exports.GapAnalysisSchema = zod_1.z.object({
    analysis: zod_1.z.array(zod_1.z.object({
        requirement: zod_1.z.string(),
        type: zod_1.z.enum(['must-have', 'nice-to-have']),
        status: zod_1.z.enum(['Met', 'Partial', 'Missing']),
        evidence: zod_1.z.string().describe("Evidence from resume supporting the status")
    }))
});
async function performGapAnalysis(resume, requirements) {
    const systemPrompt = `You are an expert technical assessor. Compare the parsed resume data against the job requirements.
Output MUST be valid JSON adhering exactly to the requested schema.`;
    const userPrompt = `Resume Data:\n${JSON.stringify(resume, null, 2)}\n\nRequirements:\n${JSON.stringify(requirements, null, 2)}\n\nPerform a gap analysis for each requirement.`;
    return (0, llm_1.callClaudeWithZod)(systemPrompt, userPrompt, exports.GapAnalysisSchema);
}
