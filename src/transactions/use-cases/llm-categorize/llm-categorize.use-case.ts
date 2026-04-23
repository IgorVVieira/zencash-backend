import { inject, injectable } from 'tsyringe';

import { IBaseUseCase } from '@shared/domain/use-cases/base.use-case';
import { ILlmProvider } from '@shared/gateways/llm-provider.port';
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
          categoryId: 'string uuidv4',
        },
      ];

      const prompt = `
      You are a financial transaction categorization assistant.
      
      ## Task
      Analyze the transactions below and assign the most appropriate category to each one based on the description and value.
      
      ## Categories available
      ${JSON.stringify(categoriesData, null, 2)}
      
      ## Transactions to categorize
      ${JSON.stringify(transactions, null, 2)}
      
      ## Rules
      - Each transaction must receive exactly one category
      - Choose the category that best matches the transaction description
      - If no category fits, return null in categoryId
      - Return one result per transaction, keeping the original externalId
      
      ## Expected return format
      ${JSON.stringify(exampleReturn, null, 2)}
      `;

      return await this.llmProvider.execute<LlmCategorizeDtoResponseDto[]>(prompt);
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
