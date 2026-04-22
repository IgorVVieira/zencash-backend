import { inject, injectable } from 'tsyringe';

import { IBaseUseCase } from '@shared/domain/use-cases/base.use-case';
import { Injections } from '@shared/types/injections';

import { ITransactionRepositoryPort } from '@transactions/domain/repositories/transaction.repository.port';
import { GetTransactionsDto, TransactionDto } from '@transactions/dtos';

@injectable()
export class GetTransactionsByDateUseCase
  implements IBaseUseCase<GetTransactionsDto, TransactionDto[]>
{
  constructor(
    @inject(Injections.TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepositoryPort,
  ) {}

  async execute(data: GetTransactionsDto): Promise<TransactionDto[]> {
    const { userId, month, year } = data;

    if (isNaN(month) || isNaN(year)) {
      return [];
    }

    const transactions = await this.transactionRepository.findByDate({
      month,
      year,
      userId,
    });

    return transactions.map(transaction => ({
      id: transaction.id as string,
      userId: transaction.userId,
      type: transaction.type,
      method: transaction.method,
      externalId: transaction.externalId,
      description: transaction.description,
      date: transaction.date,
      amount: transaction.amount,
      category: {
        id: transaction?.category?.id as string,
        color: transaction?.category?.color as string,
        name: transaction?.category?.name as string,
      },
    }));
  }
}
