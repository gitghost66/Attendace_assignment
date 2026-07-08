"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeSchema = void 0;
exports.parseResume = parseResume;
const zod_1 = require("zod");
const llm_1 = require("./llm");
exports.ResumeSchema = zod_1.z.object({
    skills: zod_1.z.array(zod_1.z.string()).describe("List of technical and soft skills"),
    experience: zod_1.z.array(zod_1.z.object({
        role: zod_1.z.string(),
        company: zod_1.z.string(),
        years: zod_1.z.number().describe("Estimated years of experience in this role"),
        description: zod_1.z.string()
    })),
    education: zod_1.z.array(zod_1.z.object({
        degree: zod_1.z.string(),
        institution: zod_1.z.string(),
        year: zod_1.z.string().optional()
    })),
    projects: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string(),
        description: zod_1.z.string(),
        technologies: zod_1.z.array(zod_1.z.string())
    })).optional(),
    certifications: zod_1.z.array(zod_1.z.string()).optional()
});
async function parseResume(resumeText) {
    const systemPrompt = `You are an expert HR parser. Your job is to extract structured data from the provided resume text.
Output MUST be valid JSON adhering exactly to the requested schema. Do not add any text outside the JSON block.`;
    const userPrompt = `Please parse the following resume:\n\n${resumeText}\n\nReturn the JSON structure matching the schema.`;
    return (0, llm_1.callClaudeWithZod)(systemPrompt, userPrompt, exports.ResumeSchema);
}
