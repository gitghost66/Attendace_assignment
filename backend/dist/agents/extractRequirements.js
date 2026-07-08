"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirementsSchema = void 0;
exports.extractRequirements = extractRequirements;
const zod_1 = require("zod");
const llm_1 = require("./llm");
exports.RequirementsSchema = zod_1.z.object({
    mustHaves: zod_1.z.array(zod_1.z.string()).describe("Absolute requirements (e.g. 5+ years of React, CS Degree)"),
    niceToHaves: zod_1.z.array(zod_1.z.string()).describe("Preferred but not strictly required skills or experiences"),
});
async function extractRequirements(jobDescription) {
    const systemPrompt = `You are an expert technical recruiter. Analyze the job description and extract the core requirements into must-haves and nice-to-haves. Output MUST be valid JSON adhering exactly to the requested schema.`;
    const userPrompt = `Job Description:\n\n${jobDescription}\n\nExtract requirements into JSON.`;
    return (0, llm_1.callClaudeWithZod)(systemPrompt, userPrompt, exports.RequirementsSchema);
}
