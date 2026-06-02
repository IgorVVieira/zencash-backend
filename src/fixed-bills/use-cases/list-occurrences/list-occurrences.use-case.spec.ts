import { baseRepository, BaseRepositoryMock } from '@shared/test/mocks/base-repository';

import { OccurrenceStatus } from '@fixed-bills/domain/entities/fixed-bill-occurrence.entity';
import { ListOccurrencesUseCase } from '@fixed-bills/use-cases/list-occurrences/list-occurrences.use-case';

describe('ListOccurrencesUseCase', () => {
  type SutTypes = {
    sut: ListOccurrencesUseCase;
    occurrenceRepoMock: BaseRepositoryMock & {
      findByPeriod: jest.Mock;
      findByBillAndPeriod: jest.Mock;
      deleteFuturePendingByBillId: jest.Mock;
      deletePendingByBillId: jest.Mock;
    };
  };

  const makeSut = (): SutTypes => {
    const occurrenceRepoMock = {
      ...baseRepository,
      findByPeriod: jest.fn(),
      findByBillAndPeriod: jest.fn(),
      deleteFuturePendingByBillId: jest.fn(),
      deletePendingByBillId: jest.fn(),
    };
    const sut = new ListOccurrencesUseCase(occurrenceRepoMock);
    return { sut, occurrenceRepoMock };
  };

  it('should return occurrences for the given period', async () => {
    const { sut, occurrenceRepoMock } = makeSut();

    occurrenceRepoMock.findByPeriod.mockResolvedValue([
      {
        id: 'occ-1',
        fixedBillId: 'bill-1',
        name: 'Água',
        estimatedAmount: 150,
        paidAmount: 143.5,
        dueDate: new Date('2026-06-10'),
        status: OccurrenceStatus.PAID,
        transactionId: 'tx-1',
        categoryName: null,
        categoryColor: null,
        recurrence: 'MONTHLY',
      },
    ]);

    const result = await sut.execute({ userId: 'user-1', month: 6, year: 2026 });

    expect(occurrenceRepoMock.findByPeriod).toHaveBeenCalledWith({
      userId: 'user-1',
      month: 6,
      year: 2026,
    });
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe(OccurrenceStatus.PAID);
  });

  it('should return empty array when no occurrences exist', async () => {
    const { sut, occurrenceRepoMock } = makeSut();

    occurrenceRepoMock.findByPeriod.mockResolvedValue([]);

    const result = await sut.execute({ userId: 'user-1', month: 6, year: 2026 });

    expect(result).toEqual([]);
  });
});
