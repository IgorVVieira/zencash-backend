import { inject, injectable } from 'tsyringe';

import { IBaseUseCase } from '@shared/domain/use-cases/base.use-case';
import { EntityNotFoundError } from '@shared/errors/entity-not-found.error';
import { Injections } from '@shared/types/injections';

import { FixedBillEntity } from '@fixed-bills/domain/entities/fixed-bill.entity';
import { IFixedBillOccurrenceRepositoryPort } from '@fixed-bills/domain/repositories/fixed-bill-occurrence.repository.port';
import { IFixedBillRepositoryPort } from '@fixed-bills/domain/repositories/fixed-bill.repository.port';

type DeleteFixedBillInput = { id: string; userId: string };

@injectable()
export class DeleteFixedBillUseCase implements IBaseUseCase<DeleteFixedBillInput, void> {
  constructor(
    @inject(Injections.FIXED_BILL_REPOSITORY)
    private readonly fixedBillRepository: IFixedBillRepositoryPort,
    @inject(Injections.FIXED_BILL_OCCURRENCE_REPOSITORY)
    private readonly occurrenceRepository: IFixedBillOccurrenceRepositoryPort,
  ) {}

  async execute(data: DeleteFixedBillInput): Promise<void> {
    const bill = await this.fixedBillRepository.findOne(data.id);

    if (!bill || (bill as FixedBillEntity).userId !== data.userId) {
      throw new EntityNotFoundError('FixedBill');
    }

    await this.fixedBillRepository.softDelete(data.id, data.userId);
    await this.occurrenceRepository.deletePendingByBillId(data.id);
  }
}
