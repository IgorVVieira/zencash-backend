import { inject, injectable } from 'tsyringe';

import { IBaseUseCase } from '@shared/domain/use-cases/base.use-case';
import { EntityNotFoundError } from '@shared/errors/entity-not-found.error';
import { Injections } from '@shared/types/injections';

import { FixedBillOccurrenceEntity } from '@fixed-bills/domain/entities/fixed-bill-occurrence.entity';
import { IFixedBillOccurrenceRepositoryPort } from '@fixed-bills/domain/repositories/fixed-bill-occurrence.repository.port';
import { UpdateOccurrenceDto } from '@fixed-bills/dtos/update-occurrence.dto';
import { OccurrenceResponseDto } from '@fixed-bills/dtos/fixed-bill-response.dto';

@injectable()
export class UpdateOccurrenceUseCase
  implements IBaseUseCase<UpdateOccurrenceDto, OccurrenceResponseDto>
{
  constructor(
    @inject(Injections.FIXED_BILL_OCCURRENCE_REPOSITORY)
    private readonly occurrenceRepository: IFixedBillOccurrenceRepositoryPort,
  ) {}

  async execute(data: UpdateOccurrenceDto): Promise<OccurrenceResponseDto> {
    const occurrence = await this.occurrenceRepository.findOne(data.id);

    if (!occurrence || (occurrence as FixedBillOccurrenceEntity).userId !== data.userId) {
      throw new EntityNotFoundError('FixedBillOccurrence');
    }

    const updateData =
      data.status === 'PAID'
        ? { status: 'PAID', paidAmount: data.paidAmount }
        : { status: 'PENDING', paidAmount: null, transactionId: null };

    const updated = await this.occurrenceRepository.update(data.id, updateData as any);
    const o = updated as FixedBillOccurrenceEntity;

    return {
      id: o.id as string,
      fixedBillId: o.fixedBillId,
      name: '',
      categoryName: null,
      categoryColor: null,
      recurrence: '',
      estimatedAmount: 0,
      paidAmount: o.paidAmount ?? null,
      dueDate: o.dueDate,
      status: o.status,
      transactionId: o.transactionId ?? null,
    };
  }
}
