import { baseRepository, BaseRepositoryMock } from '@shared/test/mocks/base-repository';

import { FixedBillRecurrence } from '@fixed-bills/domain/entities/fixed-bill.entity';
import { OccurrenceStatus } from '@fixed-bills/domain/entities/fixed-bill-occurrence.entity';
import { matchTransactionsToFixedBills } from '@transactions/use-cases/transaction-import-consumer/transaction-import-consumer.use-case';

describe('matchTransactionsToFixedBills', () => {
  const makeRepos = () => {
    const fixedBillRepoMock = {
      ...baseRepository,
      findAllActiveByUserId: jest.fn(),
      softDelete: jest.fn(),
    };
    const occurrenceRepoMock = {
      ...baseRepository,
      findByPeriod: jest.fn(),
      findByBillAndPeriod: jest.fn(),
      deleteFuturePendingByBillId: jest.fn(),
      deletePendingByBillId: jest.fn(),
    };
    return { fixedBillRepoMock, occurrenceRepoMock };
  };

  it('should mark occurrence as PAID when transaction description matches a keyword', async () => {
    const { fixedBillRepoMock, occurrenceRepoMock } = makeRepos();

    fixedBillRepoMock.findAllActiveByUserId.mockResolvedValue([
      {
        id: 'bill-1',
        userId: 'user-1',
        recurrence: FixedBillRecurrence.MONTHLY,
        matchKeywords: ['COPASA'],
      },
    ]);
    occurrenceRepoMock.findByBillAndPeriod.mockResolvedValue({
      id: 'occ-1',
      status: OccurrenceStatus.PENDING,
    });
    occurrenceRepoMock.update.mockResolvedValue({});

    const transactions = [
      {
        id: 'tx-1',
        userId: 'user-1',
        description: 'PAGAMENTO COPASA JUNHO',
        amount: 143.5,
        date: new Date('2026-06-08'),
      },
    ];

    await matchTransactionsToFixedBills(
      transactions as any,
      'user-1',
      fixedBillRepoMock,
      occurrenceRepoMock,
    );

    expect(occurrenceRepoMock.update).toHaveBeenCalledWith(
      'occ-1',
      expect.objectContaining({ status: 'PAID', paidAmount: 143.5, transactionId: 'tx-1' }),
    );
  });

  it('should not overwrite a PAID occurrence', async () => {
    const { fixedBillRepoMock, occurrenceRepoMock } = makeRepos();

    fixedBillRepoMock.findAllActiveByUserId.mockResolvedValue([
      { id: 'bill-1', userId: 'user-1', matchKeywords: ['COPASA'] },
    ]);
    occurrenceRepoMock.findByBillAndPeriod.mockResolvedValue({
      id: 'occ-1',
      status: OccurrenceStatus.PAID,
    });

    const transactions = [
      {
        id: 'tx-2',
        userId: 'user-1',
        description: 'COPASA SEGUNDA VIA',
        amount: 143.5,
        date: new Date('2026-06-10'),
      },
    ];

    await matchTransactionsToFixedBills(
      transactions as any,
      'user-1',
      fixedBillRepoMock,
      occurrenceRepoMock,
    );

    expect(occurrenceRepoMock.update).not.toHaveBeenCalled();
  });

  it('should leave occurrence untouched when no keyword matches', async () => {
    const { fixedBillRepoMock, occurrenceRepoMock } = makeRepos();

    fixedBillRepoMock.findAllActiveByUserId.mockResolvedValue([
      { id: 'bill-1', userId: 'user-1', matchKeywords: ['COPASA'] },
    ]);

    const transactions = [
      {
        id: 'tx-3',
        userId: 'user-1',
        description: 'SUPERMERCADO XYZ',
        amount: 200,
        date: new Date('2026-06-08'),
      },
    ];

    await matchTransactionsToFixedBills(
      transactions as any,
      'user-1',
      fixedBillRepoMock,
      occurrenceRepoMock,
    );

    expect(occurrenceRepoMock.findByBillAndPeriod).not.toHaveBeenCalled();
    expect(occurrenceRepoMock.update).not.toHaveBeenCalled();
  });
});
