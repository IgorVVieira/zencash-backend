export type CreateFixedBillDto = {
  userId: string;
  name: string;
  amount: number;
  categoryId?: string | null;
  recurrence: 'MONTHLY' | 'ANNUAL';
  dueDay: number;
  dueMonth?: number | null;
  matchKeywords: string[];
};
