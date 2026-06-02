import { injectable } from 'tsyringe';

import { BaseRepository } from '@shared/repositories/base.repository';

import {
  FixedBillOccurrenceEntity,
  OccurrenceStatus,
} from '@fixed-bills/domain/entities/fixed-bill-occurrence.entity';
import {
  FindOccurrenceByBillAndPeriodParams,
  FindOccurrencesByPeriodParams,
  IFixedBillOccurrenceRepositoryPort,
} from '@fixed-bills/domain/repositories/fixed-bill-occurrence.repository.port';

import { PrismaClientSingleton } from '../../../prisma-client';

@injectable()
export class FixedBillOccurrenceRepositoryAdapter
  extends BaseRepository<FixedBillOccurrenceEntity>
  implements IFixedBillOccurrenceRepositoryPort
{
  private readonly prisma;

  constructor() {
    const prisma = PrismaClientSingleton.getInstance();
    super(prisma.fixedBillOccurrence);
    this.prisma = prisma;
  }

  async findByPeriod(params: FindOccurrencesByPeriodParams): Promise<FixedBillOccurrenceEntity[]> {
    const { userId, month, year } = params;

    const occurrences = await this.prisma.fixedBillOccurrence.findMany({
      where: {
        userId,
        referenceMonth: month,
        referenceYear: year,
        deletedAt: null,
      },
      include: {
        fixedBill: true,
      },
    });

    const now = new Date();

    return occurrences
      .filter(o => o.fixedBill?.deletedAt == null)
      .map(o => ({
        ...o,
        status: this.computeStatus(o.status, o.dueDate, now),
        name: o.fixedBill?.name ?? '',
        estimatedAmount: o.fixedBill?.amount ?? 0,
        categoryName: null,
        categoryColor: null,
        recurrence: o.fixedBill?.recurrence ?? '',
      }));
  }

  async findByBillAndPeriod(
    params: FindOccurrenceByBillAndPeriodParams,
  ): Promise<FixedBillOccurrenceEntity | null> {
    const { fixedBillId, referenceMonth, referenceYear } = params;

    const occurrence = await this.prisma.fixedBillOccurrence.findFirst({
      where: { fixedBillId, referenceMonth, referenceYear, deletedAt: null },
    });

    if (!occurrence) return null;

    return {
      ...occurrence,
      status: this.computeStatus(occurrence.status, occurrence.dueDate, new Date()),
    };
  }

  async deleteFuturePendingByBillId(
    fixedBillId: string,
    fromMonth: number,
    fromYear: number,
  ): Promise<void> {
    await this.prisma.fixedBillOccurrence.updateMany({
      where: {
        fixedBillId,
        status: 'PENDING',
        deletedAt: null,
        OR: [
          { referenceYear: { gt: fromYear } },
          { referenceYear: fromYear, referenceMonth: { gte: fromMonth } },
        ],
      },
      data: { deletedAt: new Date() },
    });
  }

  async deletePendingByBillId(fixedBillId: string): Promise<void> {
    await this.prisma.fixedBillOccurrence.updateMany({
      where: { fixedBillId, status: 'PENDING', deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  private computeStatus(stored: string, dueDate: Date, now: Date): OccurrenceStatus {
    if (stored === 'PAID') return OccurrenceStatus.PAID;
    if (dueDate < now) return OccurrenceStatus.OVERDUE;
    return OccurrenceStatus.PENDING;
  }
}
