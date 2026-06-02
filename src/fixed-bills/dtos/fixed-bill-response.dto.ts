export type FixedBillResponseDto = {
  id: string;
  name: string;
  amount: number;
  categoryId: string | null;
  categoryName: string | null;
  categoryColor: string | null;
  recurrence: string;
  dueDay: number;
  dueMonth: number | null;
  matchKeywords: string[];
  isActive: boolean;
  createdAt: Date;
};

export type OccurrenceResponseDto = {
  id: string;
  fixedBillId: string;
  name: string;
  categoryName: string | null;
  categoryColor: string | null;
  recurrence: string;
  estimatedAmount: number;
  paidAmount: number | null;
  dueDate: Date;
  status: string;
  transactionId: string | null;
};

export type FixedBillsSummaryDto = {
  totalEstimated: number;
  totalPaid: number;
  totalPending: number;
  pendingOccurrences: Array<{
    id: string;
    name: string;
    estimatedAmount: number;
    dueDate: Date;
    status: string;
  }>;
};
