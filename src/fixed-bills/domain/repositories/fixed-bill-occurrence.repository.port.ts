import { IBaseRepository } from '@shared/domain/repositories/base.repository.interface';

import { FixedBillOccurrenceEntity } from '@fixed-bills/domain/entities/fixed-bill-occurrence.entity';

export type FindOccurrencesByPeriodParams = {
  userId: string;
  month: number;
  year: number;
};

export type FindOccurrenceByBillAndPeriodParams = {
  fixedBillId: string;
  referenceMonth: number;
  referenceYear: number;
};

export interface IFixedBillOccurrenceRepositoryPort
  extends IBaseRepository<FixedBillOccurrenceEntity> {
  findByPeriod(params: FindOccurrencesByPeriodParams): Promise<FixedBillOccurrenceEntity[]>;
  findByBillAndPeriod(
    params: FindOccurrenceByBillAndPeriodParams,
  ): Promise<FixedBillOccurrenceEntity | null>;
  deleteFuturePendingByBillId(
    fixedBillId: string,
    fromMonth: number,
    fromYear: number,
  ): Promise<void>;
  deletePendingByBillId(fixedBillId: string): Promise<void>;
}
