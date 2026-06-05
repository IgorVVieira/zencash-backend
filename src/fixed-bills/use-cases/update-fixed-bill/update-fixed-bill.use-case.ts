import { inject, injectable } from 'tsyringe';

import { IBaseUseCase } from '@shared/domain/use-cases/base.use-case';
import { EntityNotFoundError } from '@shared/errors/entity-not-found.error';
import { Injections } from '@shared/types/injections';

import {
  FixedBillEntity,
  FixedBillRecurrence,
} from '@fixed-bills/domain/entities/fixed-bill.entity';
import { IFixedBillOccurrenceRepositoryPort } from '@fixed-bills/domain/repositories/fixed-bill-occurrence.repository.port';
import { IFixedBillRepositoryPort } from '@fixed-bills/domain/repositories/fixed-bill.repository.port';
import { UpdateFixedBillDto } from '@fixed-bills/dtos/update-fixed-bill.dto';
import { FixedBillResponseDto } from '@fixed-bills/dtos/fixed-bill-response.dto';

const STRUCTURAL_FIELDS = ['dueDay', 'dueMonth', 'recurrence'] as const;

@injectable()
export class UpdateFixedBillUseCase
  implements IBaseUseCase<UpdateFixedBillDto, FixedBillResponseDto>
{
  constructor(
    @inject(Injections.FIXED_BILL_REPOSITORY)
    private readonly fixedBillRepository: IFixedBillRepositoryPort,
    @inject(Injections.FIXED_BILL_OCCURRENCE_REPOSITORY)
    private readonly occurrenceRepository: IFixedBillOccurrenceRepositoryPort,
  ) {}

  async execute(data: UpdateFixedBillDto): Promise<FixedBillResponseDto> {
    const existing = await this.fixedBillRepository.findOne(data.id);

    if (!existing || (existing as FixedBillEntity).userId !== data.userId) {
      throw new EntityNotFoundError('FixedBill');
    }

    const updated = await this.fixedBillRepository.update(
      data.id,
      data as Partial<FixedBillEntity>,
    );

    const hasStructuralChange = STRUCTURAL_FIELDS.some(
      field => data[field] !== undefined && data[field] !== (existing as any)[field],
    );

    if (hasStructuralChange) {
      const now = new Date();
      const currentMonth = now.getUTCMonth() + 1;
      const currentYear = now.getUTCFullYear();

      await this.occurrenceRepository.deleteFuturePendingByBillId(
        data.id,
        currentMonth,
        currentYear,
      );

      const merged = { ...(existing as FixedBillEntity), ...data } as FixedBillEntity;
      const occurrences = this.buildOccurrences(merged, currentMonth, currentYear);
      if (occurrences.length > 0) {
        await this.occurrenceRepository.createMany(occurrences as any);
      }
    }

    return {
      id: updated.id as string,
      name: (updated as FixedBillEntity).name,
      amount: (updated as FixedBillEntity).amount,
      categoryId: (updated as FixedBillEntity).categoryId ?? null,
      categoryName: null,
      categoryColor: null,
      recurrence: (updated as FixedBillEntity).recurrence,
      dueDay: (updated as FixedBillEntity).dueDay,
      dueMonth: (updated as FixedBillEntity).dueMonth ?? null,
      matchKeywords: (updated as FixedBillEntity).matchKeywords,
      isActive: (updated as FixedBillEntity).isActive,
      createdAt: updated.createdAt as Date,
    };
  }

  private buildOccurrences(bill: FixedBillEntity, fromMonth: number, fromYear: number) {
    if (bill.recurrence === FixedBillRecurrence.MONTHLY) {
      return Array.from({ length: 12 - fromMonth + 1 }, (_, i) => {
        const month = fromMonth + i;
        return {
          fixedBillId: bill.id,
          userId: bill.userId,
          referenceMonth: month,
          referenceYear: fromYear,
          dueDate: new Date(Date.UTC(fromYear, month - 1, bill.dueDay)),
          status: 'PENDING',
        };
      });
    }

    const dueMonth = bill.dueMonth as number;
    const now = new Date();
    const dueThisYear = new Date(Date.UTC(fromYear, dueMonth - 1, bill.dueDay));
    const targetYear = dueThisYear >= now ? fromYear : fromYear + 1;

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
