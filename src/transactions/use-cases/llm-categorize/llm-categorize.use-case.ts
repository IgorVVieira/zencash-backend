import { inject, injectable } from 'tsyringe';

import { IBaseUseCase } from '@shared/domain/use-cases/base.use-case';
import { ILlmProvider } from '@shared/llm/llm-provider.port';
import { Injections } from '@shared/types/injections';
import { logger } from '@shared/utils/logger';

import { CategoryDto } from '@transactions/dtos';
import {
  LlmCategorizeDto,
  LlmCategorizeDtoResponseDto,
} from '@transactions/dtos/llm-categorize.dto';

@injectable()
export class LlmCategorizeUseCase
  implements IBaseUseCase<LlmCategorizeDto, LlmCategorizeDtoResponseDto[]>
{
  constructor(
    @inject(Injections.LLM_PROVIDER) private readonly llmProvider: ILlmProvider,
    @inject(Injections.LIST_CATEGORIES_USE_CASE)
    private readonly listCategoriesUseCase: IBaseUseCase<string, CategoryDto[]>,
  ) {}

  async execute(data: LlmCategorizeDto): Promise<LlmCategorizeDtoResponseDto[]> {
    const { userId, transactions } = data;

    try {
      const categories = await this.listCategoriesUseCase.execute(userId);

      const categoriesData = categories.map(category => ({
        id: category.id,
        name: category.name,
      }));

      const exampleReturn: LlmCategorizeDtoResponseDto[] = [
        {
          externalId: 'string',
          categoryId: 'string uuidv4 || null',
        },
      ];

      const instructions = 'You are a financial transaction categorization assistant.';
      const prompt = `
      ## Role
      You are a financial transaction categorization engine. Your only job is to assign categories to transactions with high precision.
      ## Available Categories
      ${JSON.stringify(categoriesData, null, 2)}
      ## Transactions to Categorize
      ${JSON.stringify(transactions, null, 2)}
      ## Categorization Rules
      1. Analyze each transaction's description semantically — consider abbreviations, merchant names, and common patterns (e.g., "PGTO PIX", "COMPRA DEBITO", "TED RECEBIDA").
      2. Assign the category whose name **best matches** the nature of the transaction.
      3. A weak or uncertain match is NOT acceptable — if you are not confident, return null.
      4. Return **null** in categoryId when:
         - No category is a clear match
         - The description is ambiguous and could fit multiple categories equally
         - The transaction appears to be a transfer, reversal, or adjustment with no clear category
      5. Do NOT invent, guess, or use categories not listed above.
      6. Return **exactly one result per transaction**, preserving the original externalId.
      ## Output Format
      Return a **raw JSON array only** — no markdown, no explanation, no code fences.
      Each element must follow this exact structure:
      { "externalId": string, "categoryId": string | null }
      
      ## Example Output
      ${JSON.stringify(exampleReturn)}
      `;

      return await this.llmProvider.execute<LlmCategorizeDtoResponseDto[]>(prompt, instructions);
    } catch (error) {
      const isRateLimit = (error as { status?: number })?.status === 429;
      if (isRateLimit) {
        logger.warn({
          message: 'LLM categorization skipped (rate limit) — transactions saved without categories',
        });
      } else {
        logger.error({ message: 'Error in LlmCategorizeUseCase', error });
      }

      return [];
    }
  }
}
