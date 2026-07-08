"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.callClaudeWithZod = callClaudeWithZod;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const anthropic = new sdk_1.default({
    apiKey: process.env.ANTHROPIC_API_KEY || '',
});
async function callClaudeWithZod(systemPrompt, userPrompt, schema, retries = 2) {
    let attempt = 0;
    let lastError = '';
    while (attempt <= retries) {
        try {
            const response = await anthropic.messages.create({
                model: 'claude-3-5-sonnet-20240620', // or whatever recent model
                max_tokens: 4000,
                temperature: 0.1, // low temperature for structural consistency
                system: systemPrompt,
                messages: [
                    { role: 'user', content: userPrompt + (attempt > 0 ? `\n\nFix this JSON error: ${lastError}` : '') }
                ]
            });
            const responseText = response.content[0].text;
            // Extract JSON if it's wrapped in markdown
            let jsonString = responseText;
            const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
            if (jsonMatch) {
                jsonString = jsonMatch[1];
            }
            const parsed = JSON.parse(jsonString);
            return schema.parse(parsed);
        }
        catch (error) {
            console.error(`Attempt ${attempt + 1} failed:`, error.message);
            lastError = error.message;
            attempt++;
        }
    }
    throw new Error(`Failed to get valid JSON from Claude after ${retries + 1} attempts. Last error: ${lastError}`);
}
