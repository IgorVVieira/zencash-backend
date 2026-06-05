import { IBaseRepository } from '@shared/domain/repositories/base.repository.interface';

import { FixedBillEntity } from '@fixed-bills/domain/entities/fixed-bill.entity';

export interface IFixedBillRepositoryPort extends IBaseRepository<FixedBillEntity> {
  findAllActiveByUserId(userId: string): Promise<FixedBillEntity[]>;
  softDelete(id: string, userId: string): Promise<void>;
}
