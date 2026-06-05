import { BaseEntity } from '@shared/domain/entities/base-entity';

export enum FixedBillRecurrence {
  MONTHLY = 'MONTHLY',
  ANNUAL = 'ANNUAL',
}

export class FixedBillEntity extends BaseEntity {
  userId: string;
  categoryId?: string | null;
  name: string;
  amount: number;
  recurrence: FixedBillRecurrence;
  dueDay: number;
  dueMonth?: number | null;
  matchKeywords: string[];
  isActive: boolean;
}
