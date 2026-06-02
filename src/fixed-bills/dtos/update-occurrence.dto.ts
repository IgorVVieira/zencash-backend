export type UpdateOccurrenceDto = {
  id: string;
  userId: string;
  status: 'PAID' | 'PENDING';
  paidAmount?: number;
};
