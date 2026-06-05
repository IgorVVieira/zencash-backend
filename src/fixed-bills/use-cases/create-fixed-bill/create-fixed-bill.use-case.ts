import { inject, injectable } from 'tsyringe';

import { IBaseUseCase } from '@shared/domain/use-cases/base.use-case';
import { Injections } from '@shared/types/injections';

import {
  FixedBillEntity,
  FixedBillRecurrence,
} from '@fixed-bills/domain/entities/fixed-bill.entity';
import { IFixedBillOccurrenceRepositoryPort } from '@fixed-bills/domain/repositories/fixed-bill-occurrence.repository.port';
import { IFixedBillRepositoryPort } from '@fixed-bills/domain/repositories/fixed-bill.repository.port';
import { CreateFixedBillDto } from '@fixed-bills/dtos/create-fixed-bill.dto';
import { FixedBillResponseDto } from '@fixed-bills/dtos/fixed-bill-response.dto';

@injectable()
export class CreateFixedBillUseCase
  implements IBaseUseCase<CreateFixedBillDto, FixedBillResponseDto>
{
  constructor(
    @inject(Injections.FIXED_BILL_REPOSITORY)
    private readonly fixedBillRepository: IFixedBillRepositoryPort,
    @inject(Injections.FIXED_BILL_OCCURRENCE_REPOSITORY)
    private readonly occurrenceRepository: IFixedBillOccurrenceRepositoryPort,
  ) {}

  async execute(data: CreateFixedBillDto): Promise<FixedBillResponseDto> {
    const bill = await this.fixedBillRepository.create({
      ...data,
      isActive: true,
    } as FixedBillEntity);

    const occurrences = this.buildOccurrences(bill);
    if (occurrences.length > 0) {
      await this.occurrenceRepository.createMany(occurrences as any);
    }

    return {
      id: bill.id as string,
      name: bill.name,
      amount: bill.amount,
      categoryId: bill.categoryId ?? null,
      categoryName: null,
      categoryColor: null,
      recurrence: bill.recurrence,
      dueDay: bill.dueDay,
      dueMonth: bill.dueMonth ?? null,
      matchKeywords: bill.matchKeywords,
      isActive: bill.isActive,
      createdAt: bill.createdAt as Date,
    };
  }

  private buildOccurrences(bill: FixedBillEntity) {
    const now = new Date();
    const currentYear = now.getUTCFullYear();
    const currentMonth = now.getUTCMonth() + 1;

    if (bill.recurrence === FixedBillRecurrence.MONTHLY) {
      return Array.from({ length: 12 - currentMonth + 1 }, (_, i) => {
        const month = currentMonth + i;
        return {
          fixedBillId: bill.id,
          userId: bill.userId,
          referenceMonth: month,
          referenceYear: currentYear,
          dueDate: new Date(Date.UTC(currentYear, month - 1, bill.dueDay)),
          status: 'PENDING',
        };
      });
    }

    // ANNUAL
    const dueMonth = bill.dueMonth as number;
    const dueThisYear = new Date(Date.UTC(currentYear, dueMonth - 1, bill.dueDay));
    const targetYear = dueThisYear >= now ? currentYear : currentYear + 1;

    return [
      {
        fixedBillId: bill.id,
        userId: bill.userId,
        referenceMonth: dueMonth,
        referenceYear: targetYear,
        dueDate: new Date(Date.UTC(targetYear, dueMonth - 1, bill.dueDay)),
        status: 'PENDING',
      },
    ];
  }
}
