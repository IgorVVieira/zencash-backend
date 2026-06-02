import { inject, injectable } from 'tsyringe';

import { IBaseUseCase } from '@shared/domain/use-cases/base.use-case';
import { Injections } from '@shared/types/injections';

import { IFixedBillOccurrenceRepositoryPort } from '@fixed-bills/domain/repositories/fixed-bill-occurrence.repository.port';
import { ListOccurrencesQueryDto } from '@fixed-bills/dtos/list-occurrences-query.dto';
import { OccurrenceResponseDto } from '@fixed-bills/dtos/fixed-bill-response.dto';

@injectable()
export class ListOccurrencesUseCase
  implements IBaseUseCase<ListOccurrencesQueryDto, OccurrenceResponseDto[]>
{
  constructor(
    @inject(Injections.FIXED_BILL_OCCURRENCE_REPOSITORY)
    private readonly occurrenceRepository: IFixedBillOccurrenceRepositoryPort,
  ) {}

  async execute(data: ListOccurrencesQueryDto): Promise<OccurrenceResponseDto[]> {
    const occurrences = await this.occurrenceRepository.findByPeriod(data);

    return occurrences.map(o => ({
      id: o.id as string,
      fixedBillId: o.fixedBillId,
      name: (o as any).name ?? '',
      categoryName: (o as any).categoryName ?? null,
      categoryColor: (o as any).categoryColor ?? null,
      recurrence: (o as any).recurrence ?? '',
      estimatedAmount: (o as any).estimatedAmount ?? 0,
      paidAmount: o.paidAmount ?? null,
      dueDate: o.dueDate,
      status: o.status,
      transactionId: o.transactionId ?? null,
    }));
  }
}
