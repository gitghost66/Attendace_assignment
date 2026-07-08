"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerdictSchema = void 0;
exports.generateVerdict = generateVerdict;
const zod_1 = require("zod");
const llm_1 = require("./llm");
exports.VerdictSchema = zod_1.z.object({
    decision: zod_1.z.enum(['Hired', 'Not Hired', 'Borderline - Interview Recommended']),
    justification: zod_1.z.string().describe("Concise justification for the decision"),
    improvementSuggestions: zod_1.z.array(zod_1.z.string()).describe("3-5 specific suggestions for the candidate if not a clean hire")
});
async function generateVerdict(score, gapAnalysis) {
    const systemPrompt = `You are the final hiring authority. Make a decisive verdict based on the candidate's score and gap analysis.
Output MUST be valid JSON adhering exactly to the requested schema.`;
    const userPrompt = `Candidate Score:\n${JSON.stringify(score, null, 2)}\n\nGap Analysis:\n${JSON.stringify(gapAnalysis, null, 2)}\n\nProvide the final verdict.`;
    return (0, llm_1.callClaudeWithZod)(systemPrompt, userPrompt, exports.VerdictSchema);
}
