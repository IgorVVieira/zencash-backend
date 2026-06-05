import { GoogleGenAI } from '@google/genai';
import { injectable } from 'tsyringe';

import { ILlmProvider } from '@shared/llm/llm-provider.port';
import { logger } from '@shared/utils/logger';
import { HttpStatusCode } from 'axios';

@injectable()
export class GeminiProvider implements ILlmProvider {
  private readonly ai: GoogleGenAI;
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_DELAY_MS = 5000;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });
  }

  async execute<T>(prompt: string): Promise<T> {
    for (let attempt = 1; attempt <= GeminiProvider.MAX_RETRIES; attempt++) {
      try {
        const response = await this.ai.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        return JSON.parse(response.text as string) as T;
      } catch (error) {
        const isRateLimit =
          (error as { status?: number })?.status === HttpStatusCode.TooManyRequests;

        if (!isRateLimit || attempt === GeminiProvider.MAX_RETRIES) {
          throw error;
        }

        const delay = GeminiProvider.BASE_DELAY_MS * 2 ** (attempt - 1);
        logger.warn({
          message: `Gemini rate limit, retrying in ${delay}ms (${attempt}/${GeminiProvider.MAX_RETRIES})`,
        });
        await new Promise(res => setTimeout(res, delay));
      }
    }

    throw new Error('Unreachable');
  }
}
