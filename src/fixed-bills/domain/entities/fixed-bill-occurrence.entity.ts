import { BaseEntity } from '@shared/domain/entities/base-entity';

export enum OccurrenceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
}

export class FixedBillOccurrenceEntity extends BaseEntity {
  fixedBillId: string;
  userId: string;
  transactionId?: string | null;
  dueDate: Date;
  status: OccurrenceStatus;
  paidAmount?: number | null;
  referenceMonth: number;
  referenceYear: number;

  // Joined fields (not stored — populated at query layer)
  name?: string;
  estimatedAmount?: number;
  categoryName?: string | null;
  categoryColor?: string | null;
  recurrence?: string;
}
