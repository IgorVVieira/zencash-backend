import { inject, injectable } from 'tsyringe';

import { IBaseUseCase } from '@shared/domain/use-cases/base.use-case';
import { EntityNotFoundError } from '@shared/errors/entity-not-found.error';
import { UnauthorizedError } from '@shared/errors/unauthorized.error';
import { Injections } from '@shared/types/injections';

import { ITransactionRepositoryPort } from '@transactions/domain/repositories/transaction.repository.port';
import { TransactionDto, UpdateTransactionDto } from '@transactions/dtos';

@injectable()
export class UpdateTransactionUseCase
  implements IBaseUseCase<UpdateTransactionDto, TransactionDto>
{
  constructor(
    @inject(Injections.TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepositoryPort,
  ) {}

  async execute(data: UpdateTransactionDto): Promise<TransactionDto> {
    const { id, userId, ...transactionData } = data;

    let transaction = await this.transactionRepository.findOne(id);

    if (!transaction) {
      throw new EntityNotFoundError('Transaction');
    }

    if (transaction.userId !== userId) {
      throw new UnauthorizedError('User not authorized to update this transaction');
    }

    transaction = await this.transactionRepository.update(id, transactionData);

    return {
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
    };
  }
}
