import OpenAI from 'openai';
import { injectable } from 'tsyringe';

import { ILlmProvider } from '@shared/llm/llm-provider.port';
import { logger } from '@shared/utils/logger';
import { HttpStatusCode } from 'axios';

@injectable()
export class OpenAiProvider implements ILlmProvider {
  private readonly ai: OpenAI;
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_DELAY_MS = 5000;

  constructor() {
    this.ai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async execute<T>(prompt: string, instructions?: string): Promise<T> {
    for (let attempt = 1; attempt <= OpenAiProvider.MAX_RETRIES; attempt++) {
      try {
        const response = await this.ai.responses.create({
          model: 'gpt-4.1-mini-2025-04-14',
          instructions: instructions,
          input: prompt,
        });

        return JSON.parse(response.output_text as string) as T;
      } catch (error) {
        const isRateLimit = (error as { status?: number })?.status === HttpStatusCode.TooManyRequests;

        if (!isRateLimit || attempt === OpenAiProvider.MAX_RETRIES) {
          throw error;
        }

        const delay = OpenAiProvider.BASE_DELAY_MS * 2 ** (attempt - 1);
        logger.warn({
          message: `Gemini rate limit, retrying in ${delay}ms (${attempt}/${OpenAiProvider.MAX_RETRIES})`,
        });
        await new Promise(res => setTimeout(res, delay));
      }
    }

    throw new Error('Unreachable');
  }
}
