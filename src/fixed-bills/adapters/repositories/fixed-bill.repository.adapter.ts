import { injectable } from 'tsyringe';

import { BaseRepository } from '@shared/repositories/base.repository';

import {
  FixedBillEntity,
  FixedBillRecurrence,
} from '@fixed-bills/domain/entities/fixed-bill.entity';
import { IFixedBillRepositoryPort } from '@fixed-bills/domain/repositories/fixed-bill.repository.port';

import { PrismaClientSingleton } from '../../../prisma-client';

@injectable()
export class FixedBillRepositoryAdapter
  extends BaseRepository<FixedBillEntity>
  implements IFixedBillRepositoryPort
{
  private readonly prisma;

  constructor() {
    const prisma = PrismaClientSingleton.getInstance();
    super(prisma.fixedBill);
    this.prisma = prisma;
  }

  async findAllActiveByUserId(userId: string): Promise<FixedBillEntity[]> {
    const bills = await this.prisma.fixedBill.findMany({
      where: { userId, isActive: true, deletedAt: null },
      include: {
        category: { where: { deletedAt: null } },
      },
    });

    return bills.map(bill => ({
      ...bill,
      recurrence: bill.recurrence as FixedBillRecurrence,
      categoryName: bill.category?.name ?? null,
      categoryColor: bill.category?.color ?? null,
    }));
  }

  async softDelete(id: string, userId: string): Promise<void> {
    await this.prisma.fixedBill.updateMany({
      where: { id, userId, deletedAt: null },
      data: { isActive: false, deletedAt: new Date() },
    });
  }
}
