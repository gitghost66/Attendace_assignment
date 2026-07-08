import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function callClaudeWithZod<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>,
  retries = 2
): Promise<T> {
  let attempt = 0;
  let lastError = '';

  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: systemPrompt,
  });

  while (attempt <= retries) {
    try {
      const prompt = userPrompt + (attempt > 0 ? `\n\nFix this JSON error: ${lastError}` : '');

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();

      // Extract JSON if it's wrapped in markdown
      let jsonString = responseText;
      const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/);
      if (jsonMatch) {
        jsonString = jsonMatch[1];
      }

      const parsed = JSON.parse(jsonString);
      return schema.parse(parsed);

    } catch (error: any) {
      console.error(`Attempt ${attempt + 1} failed:`, error.message);
      lastError = error.message;
      attempt++;
    }
  }

  throw new Error(`Failed to get valid JSON from Gemini after ${retries + 1} attempts. Last error: ${lastError}`);
}
