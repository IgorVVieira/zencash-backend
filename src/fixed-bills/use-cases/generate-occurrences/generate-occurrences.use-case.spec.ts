import { baseRepository, BaseRepositoryMock } from '@shared/test/mocks/base-repository';

import { FixedBillRecurrence } from '@fixed-bills/domain/entities/fixed-bill.entity';
import { GenerateOccurrencesUseCase } from '@fixed-bills/use-cases/generate-occurrences/generate-occurrences.use-case';

describe('GenerateOccurrencesUseCase', () => {
  type SutTypes = {
    sut: GenerateOccurrencesUseCase;
    fixedBillRepoMock: BaseRepositoryMock & {
      findAllActiveByUserId: jest.Mock;
      softDelete: jest.Mock;
    };
    occurrenceRepoMock: BaseRepositoryMock & {
      findByPeriod: jest.Mock;
      findByBillAndPeriod: jest.Mock;
      deleteFuturePendingByBillId: jest.Mock;
      deletePendingByBillId: jest.Mock;
    };
  };

  const makeSut = (): SutTypes => {
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
    const sut = new GenerateOccurrencesUseCase(fixedBillRepoMock, occurrenceRepoMock);
    return { sut, fixedBillRepoMock, occurrenceRepoMock };
  };

  it('should generate 12 MONTHLY occurrences for a given year', async () => {
    const { sut, fixedBillRepoMock, occurrenceRepoMock } = makeSut();

    fixedBillRepoMock.findAllActiveByUserId.mockResolvedValue([
      {
        id: 'bill-1',
        userId: 'user-1',
        recurrence: FixedBillRecurrence.MONTHLY,
        dueDay: 10,
        dueMonth: null,
      },
    ]);
    occurrenceRepoMock.findByBillAndPeriod.mockResolvedValue(null);
    occurrenceRepoMock.createMany.mockResolvedValue([]);

    await sut.execute({ userId: 'user-1', year: 2027 });

    const created = occurrenceRepoMock.createMany.mock.calls[0][0];
    expect(created).toHaveLength(12);
  });

  it('should skip periods that already have an occurrence (idempotent)', async () => {
    const { sut, fixedBillRepoMock, occurrenceRepoMock } = makeSut();

    fixedBillRepoMock.findAllActiveByUserId.mockResolvedValue([
      {
        id: 'bill-1',
        userId: 'user-1',
        recurrence: FixedBillRecurrence.MONTHLY,
        dueDay: 10,
        dueMonth: null,
      },
    ]);
    occurrenceRepoMock.findByBillAndPeriod.mockResolvedValue({ id: 'existing' });
    occurrenceRepoMock.createMany.mockResolvedValue([]);

    await sut.execute({ userId: 'user-1', year: 2027 });

    const created = occurrenceRepoMock.createMany.mock.calls[0][0];
    expect(created).toHaveLength(0);
  });

  it('should generate one ANNUAL occurrence for the correct month', async () => {
    const { sut, fixedBillRepoMock, occurrenceRepoMock } = makeSut();

    fixedBillRepoMock.findAllActiveByUserId.mockResolvedValue([
      {
        id: 'bill-2',
        userId: 'user-1',
        recurrence: FixedBillRecurrence.ANNUAL,
        dueDay: 15,
        dueMonth: 3,
      },
    ]);
    occurrenceRepoMock.findByBillAndPeriod.mockResolvedValue(null);
    occurrenceRepoMock.createMany.mockResolvedValue([]);

    await sut.execute({ userId: 'user-1', year: 2027 });

    const created = occurrenceRepoMock.createMany.mock.calls[0][0];
    expect(created).toHaveLength(1);
    expect(created[0]).toMatchObject({ referenceMonth: 3, referenceYear: 2027 });
  });
});
