import { inject, injectable } from 'tsyringe';

import { IBaseUseCase } from '@shared/domain/use-cases/base.use-case';
import { Injections } from '@shared/types/injections';

import { FixedBillRecurrence } from '@fixed-bills/domain/entities/fixed-bill.entity';
import { IFixedBillOccurrenceRepositoryPort } from '@fixed-bills/domain/repositories/fixed-bill-occurrence.repository.port';
import { IFixedBillRepositoryPort } from '@fixed-bills/domain/repositories/fixed-bill.repository.port';

type GenerateOccurrencesInput = { userId: string; year: number };

@injectable()
export class GenerateOccurrencesUseCase implements IBaseUseCase<GenerateOccurrencesInput, void> {
  constructor(
    @inject(Injections.FIXED_BILL_REPOSITORY)
    private readonly fixedBillRepository: IFixedBillRepositoryPort,
    @inject(Injections.FIXED_BILL_OCCURRENCE_REPOSITORY)
    private readonly occurrenceRepository: IFixedBillOccurrenceRepositoryPort,
  ) {}

  async execute(data: GenerateOccurrencesInput): Promise<void> {
    const bills = await this.fixedBillRepository.findAllActiveByUserId(data.userId);
    const occurrencesToCreate: object[] = [];

    for (const bill of bills) {
      const months =
        bill.recurrence === FixedBillRecurrence.MONTHLY
          ? Array.from({ length: 12 }, (_, i) => i + 1)
          : [bill.dueMonth as number];

      for (const month of months) {
        const existing = await this.occurrenceRepository.findByBillAndPeriod({
          fixedBillId: bill.id as string,
          referenceMonth: month,
          referenceYear: data.year,
        });

        if (!existing) {
          occurrencesToCreate.push({
            fixedBillId: bill.id,
            userId: bill.userId,
            referenceMonth: month,
            referenceYear: data.year,
            dueDate: new Date(Date.UTC(data.year, month - 1, bill.dueDay)),
            status: 'PENDING',
          });
        }
      }
    }

    await this.occurrenceRepository.createMany(occurrencesToCreate as any);
  }
}
