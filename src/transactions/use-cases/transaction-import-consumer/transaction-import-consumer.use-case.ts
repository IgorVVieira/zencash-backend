import { inject, injectable } from 'tsyringe';

import { IBaseUseCase } from '@shared/domain/use-cases/base.use-case';
import { IMessageConsumerUseCase } from '@shared/domain/use-cases/message-consumer.use-case';
import { IMessageQueuePort } from '@shared/gateways/message-queue.port';
import { Injections } from '@shared/types/injections';
import { logger } from '@shared/utils/logger';

import { IFixedBillOccurrenceRepositoryPort } from '@fixed-bills/domain/repositories/fixed-bill-occurrence.repository.port';
import { IFixedBillRepositoryPort } from '@fixed-bills/domain/repositories/fixed-bill.repository.port';
import { TransactionImportStatus } from '@transactions/domain/entities/transaction-import.entity';
import { TransactionEntity } from '@transactions/domain/entities/transaction.entity';
import { ITransactionImportRepositoryPort } from '@transactions/domain/repositories/transaction-import.repository.port';
import { ITransactionRepositoryPort } from '@transactions/domain/repositories/transaction.repository.port';
import { ImportTransactionDto } from '@transactions/dtos';
import {
  LlmCategorizeDto,
  LlmCategorizeDtoResponseDto,
} from '@transactions/dtos/llm-categorize.dto';
import { IOfxStatementParser } from '@transactions/ports/ofx-statement-parser.interface';

@injectable()
export class TransactionImportConsumerUseCase implements IMessageConsumerUseCase {
  /* eslint-disable-next-line max-params */
  constructor(
    @inject(Injections.TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepositoryPort,
    @inject(Injections.OFX_STATEMENT_PARSER)
    private readonly ofxStatementParser: IOfxStatementParser,
    @inject(Injections.MESSAGE_QUEUE_PORT) private readonly messageQueuePort: IMessageQueuePort,
    @inject(Injections.LLM_CATEGORY_USE_CASE)
    private readonly llmCategoryUseCase: IBaseUseCase<
      LlmCategorizeDto,
      LlmCategorizeDtoResponseDto[]
    >,
    @inject(Injections.TRANSACTION_IMPORT_REPOSITORY)
    private readonly transactionImportRepository: ITransactionImportRepositoryPort,
    @inject(Injections.FIXED_BILL_REPOSITORY)
    private readonly fixedBillRepository: IFixedBillRepositoryPort,
    @inject(Injections.FIXED_BILL_OCCURRENCE_REPOSITORY)
    private readonly occurrenceRepository: IFixedBillOccurrenceRepositoryPort,
  ) {}

  async start(): Promise<void> {
    console.log(process.env.QUEUE_PROCESS_TRANSACTIONS)
    await this.messageQueuePort.subscribe<ImportTransactionDto>(
      process.env.QUEUE_PROCESS_TRANSACTIONS as string,
      async data => this.processOfxStatementMessage(data),
    );
  }

  private async processOfxStatementMessage(data: ImportTransactionDto): Promise<void> {
    const { userId, file, transactionImportId } = data;

    try {
      await this.transactionImportRepository.update(transactionImportId as string, {
        status: TransactionImportStatus.PROCESSING,
      });

      const serialized = file.buffer as unknown as { data: number[] };
      const buffer = Buffer.from(serialized.data);
      const content = buffer.toString('utf8');
      const transactions = await this.ofxStatementParser.parse(content ?? '');

      const transactionsToCreate = transactions.map(transaction => ({
        ...transaction,
        userId,
      }));

      const externalIds = transactionsToCreate.map(transaction => transaction.externalId);
      const existingTransactions = await this.transactionRepository.findByExternalIdListAndUserId(
        externalIds,
        userId,
      );

      const existingExternalIds =
        existingTransactions?.map(transaction => transaction.externalId) || [];
      const newExternalIds = externalIds.filter(id => !existingExternalIds.includes(id));

      const newTransactions = transactionsToCreate.filter(transaction =>
        newExternalIds.includes(transaction.externalId),
      );

      if (!newTransactions?.length) {
        await this.transactionImportRepository.update(transactionImportId as string, {
          status: TransactionImportStatus.COMPLETED,
        });

        return;
      }

      let transactionsToSave = newTransactions;

      if (data.useLlm) {
        const categorizedTransactions = await this.llmCategoryUseCase.execute({
          userId,
          transactions: newTransactions,
        });

        transactionsToSave = newTransactions.map(transaction => {
          const categorized = categorizedTransactions?.find(
            category => category.externalId === transaction.externalId,
          );

          return {
            ...transaction,
            categoryId: categorized?.categoryId ?? transaction.categoryId,
          };
        });
      }

      await this.transactionRepository.createMany(transactionsToSave);

      await matchTransactionsToFixedBills(
        transactionsToSave as unknown as TransactionEntity[],
        userId,
        this.fixedBillRepository,
        this.occurrenceRepository,
      );

      await this.transactionImportRepository.update(transactionImportId as string, {
        status: TransactionImportStatus.COMPLETED,
      });
    } catch (error) {
      if (transactionImportId) {
        await this.transactionImportRepository.update(transactionImportId, {
          status: TransactionImportStatus.FAILED,
        });
      }
      logger.error({ message: 'Error processing OFX from queue', error });
      throw error;
    }
  }
}

export async function matchTransactionsToFixedBills(
  transactions: TransactionEntity[],
  userId: string,
  fixedBillRepository: IFixedBillRepositoryPort,
  occurrenceRepository: IFixedBillOccurrenceRepositoryPort,
): Promise<void> {
  const bills = await fixedBillRepository.findAllActiveByUserId(userId);

  for (const transaction of transactions) {
    for (const bill of bills) {
      const matched = bill.matchKeywords.some(keyword =>
        transaction.description.toLowerCase().includes(keyword.toLowerCase()),
      );

      if (!matched) continue;

      const txDate = new Date(transaction.date);
      const occurrence = await occurrenceRepository.findByBillAndPeriod({
        fixedBillId: bill.id as string,
        referenceMonth: txDate.getUTCMonth() + 1,
        referenceYear: txDate.getUTCFullYear(),
      });

      if (occurrence && occurrence.status === 'PENDING') {
        await occurrenceRepository.update(
          occurrence.id as string,
          {
            status: 'PAID',
            paidAmount: transaction.amount,
            transactionId: transaction.id as string,
          } as any,
        );
      }

      break;
    }
  }
}
