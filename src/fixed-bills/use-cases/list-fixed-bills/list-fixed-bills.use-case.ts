import { inject, injectable } from 'tsyringe';

import { IBaseUseCase } from '@shared/domain/use-cases/base.use-case';
import { Injections } from '@shared/types/injections';

import { IFixedBillRepositoryPort } from '@fixed-bills/domain/repositories/fixed-bill.repository.port';
import { FixedBillResponseDto } from '@fixed-bills/dtos/fixed-bill-response.dto';

@injectable()
export class ListFixedBillsUseCase
  implements IBaseUseCase<{ userId: string }, FixedBillResponseDto[]>
{
  constructor(
    @inject(Injections.FIXED_BILL_REPOSITORY)
    private readonly fixedBillRepository: IFixedBillRepositoryPort,
  ) {}

  async execute(data: { userId: string }): Promise<FixedBillResponseDto[]> {
    const bills = await this.fixedBillRepository.findAllActiveByUserId(data.userId);

    return bills.map(bill => ({
      id: bill.id as string,
      name: bill.name,
      amount: bill.amount,
      categoryId: bill.categoryId ?? null,
      categoryName: (bill as any).categoryName ?? null,
      categoryColor: (bill as any).categoryColor ?? null,
      recurrence: bill.recurrence,
      dueDay: bill.dueDay,
      dueMonth: bill.dueMonth ?? null,
      matchKeywords: bill.matchKeywords,
      isActive: bill.isActive,
      createdAt: bill.createdAt as Date,
    }));
  }
}
