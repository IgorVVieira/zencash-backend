import { inject, injectable } from 'tsyringe';

import { Injections } from '@shared/types/injections';

import { IFixedBillOccurrenceRepositoryPort } from '@fixed-bills/domain/repositories/fixed-bill-occurrence.repository.port';
import { OccurrenceStatus } from '@fixed-bills/domain/entities/fixed-bill-occurrence.entity';
import { FixedBillsSummaryDto } from '@fixed-bills/dtos/fixed-bill-response.dto';
import { ITransactionRepositoryPort } from '@transactions/domain/repositories/transaction.repository.port';
import { GetTransactionsDto } from '@transactions/dtos';
import {
  TransactionsByCategoryDto,
  TransactionsByMethodDto,
  TransactionsLastSixMonthsDto,
} from '@transactions/dtos/dashboard.dto';

@injectable()
export class DashboardUseCase {
  constructor(
    @inject(Injections.TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepositoryPort,
    @inject(Injections.FIXED_BILL_OCCURRENCE_REPOSITORY)
    private readonly occurrenceRepository: IFixedBillOccurrenceRepositoryPort,
  ) {}

  async listByPaymentMethod(data: GetTransactionsDto): Promise<TransactionsByMethodDto[]> {
    return this.transactionRepository.listByPaymentMethod(data);
  }

  async listByCategory(data: GetTransactionsDto): Promise<TransactionsByCategoryDto[]> {
    return this.transactionRepository.listByCategory(data);
  }

  async listByLastSixMonths(data: GetTransactionsDto): Promise<TransactionsLastSixMonthsDto[]> {
    return this.transactionRepository.listByLastSixMonths(data);
  }

  async getFixedBillsSummary(params: {
    userId: string;
    month: number;
    year: number;
  }): Promise<FixedBillsSummaryDto> {
    const occurrences = await this.occurrenceRepository.findByPeriod(params);

    const totalEstimated = occurrences.reduce(
      (sum, o) => sum + ((o as any).estimatedAmount ?? 0),
      0,
    );
    const totalPaid = occurrences
      .filter(o => o.status === OccurrenceStatus.PAID)
      .reduce((sum, o) => sum + (o.paidAmount ?? 0), 0);

    const pendingOccurrences = occurrences
      .filter(o => o.status !== OccurrenceStatus.PAID)
      .map(o => ({
        id: o.id as string,
        name: (o as any).name ?? '',
        estimatedAmount: (o as any).estimatedAmount ?? 0,
        dueDate: o.dueDate,
        status: o.status,
      }));

    return {
      totalEstimated,
      totalPaid,
      totalPending: totalEstimated - totalPaid,
      pendingOccurrences,
    };
  }
}
