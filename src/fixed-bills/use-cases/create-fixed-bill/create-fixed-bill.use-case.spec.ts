import { baseRepository, BaseRepositoryMock } from '@shared/test/mocks/base-repository';

import { FixedBillRecurrence } from '@fixed-bills/domain/entities/fixed-bill.entity';
import { CreateFixedBillUseCase } from '@fixed-bills/use-cases/create-fixed-bill/create-fixed-bill.use-case';

describe('CreateFixedBillUseCase', () => {
  type SutTypes = {
    sut: CreateFixedBillUseCase;
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
    const sut = new CreateFixedBillUseCase(fixedBillRepoMock, occurrenceRepoMock);
    return { sut, fixedBillRepoMock, occurrenceRepoMock };
  };

  const billBase = {
    userId: 'user-1',
    name: 'Água',
    amount: 150,
    recurrence: FixedBillRecurrence.MONTHLY as const,
    dueDay: 10,
    dueMonth: null,
    matchKeywords: ['COPASA'],
  };

  it('should create a MONTHLY bill and generate occurrences for remaining months of the year', async () => {
    const { sut, fixedBillRepoMock, occurrenceRepoMock } = makeSut();

    jest.useFakeTimers().setSystemTime(new Date('2026-06-01'));

    fixedBillRepoMock.create.mockResolvedValue({ id: 'bill-1', ...billBase });
    occurrenceRepoMock.createMany.mockResolvedValue([]);

    await sut.execute(billBase);

    expect(fixedBillRepoMock.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Água', recurrence: 'MONTHLY' }),
    );

    // June through December = 7 occurrences
    const createdOccurrences = occurrenceRepoMock.createMany.mock.calls[0][0];
    expect(createdOccurrences).toHaveLength(7);
    expect(createdOccurrences[0]).toMatchObject({ referenceMonth: 6, referenceYear: 2026 });
    expect(createdOccurrences[6]).toMatchObject({ referenceMonth: 12, referenceYear: 2026 });

    jest.useRealTimers();
  });

  it('should generate exactly one occurrence when MONTHLY bill is created in December', async () => {
    const { sut, fixedBillRepoMock, occurrenceRepoMock } = makeSut();

    jest.useFakeTimers().setSystemTime(new Date('2026-12-01'));

    fixedBillRepoMock.create.mockResolvedValue({ id: 'bill-1', ...billBase });
    occurrenceRepoMock.createMany.mockResolvedValue([]);

    await sut.execute(billBase);

    const createdOccurrences = occurrenceRepoMock.createMany.mock.calls[0][0];
    expect(createdOccurrences).toHaveLength(1);
    expect(createdOccurrences[0]).toMatchObject({ referenceMonth: 12, referenceYear: 2026 });

    jest.useRealTimers();
  });

  it('should generate one occurrence for current year when ANNUAL bill due date has not passed', async () => {
    const { sut, fixedBillRepoMock, occurrenceRepoMock } = makeSut();

    jest.useFakeTimers().setSystemTime(new Date('2026-06-01'));

    const annualBill = {
      ...billBase,
      recurrence: FixedBillRecurrence.ANNUAL as const,
      dueDay: 15,
      dueMonth: 12,
    };
    fixedBillRepoMock.create.mockResolvedValue({ id: 'bill-1', ...annualBill });
    occurrenceRepoMock.createMany.mockResolvedValue([]);

    await sut.execute(annualBill);

    const createdOccurrences = occurrenceRepoMock.createMany.mock.calls[0][0];
    expect(createdOccurrences).toHaveLength(1);
    expect(createdOccurrences[0]).toMatchObject({ referenceMonth: 12, referenceYear: 2026 });

    jest.useRealTimers();
  });

  it('should generate one occurrence for next year when ANNUAL bill due date has already passed', async () => {
    const { sut, fixedBillRepoMock, occurrenceRepoMock } = makeSut();

    jest.useFakeTimers().setSystemTime(new Date('2026-06-01'));

    const annualBill = {
      ...billBase,
      recurrence: FixedBillRecurrence.ANNUAL as const,
      dueDay: 15,
      dueMonth: 3,
    };
    fixedBillRepoMock.create.mockResolvedValue({ id: 'bill-1', ...annualBill });
    occurrenceRepoMock.createMany.mockResolvedValue([]);

    await sut.execute(annualBill);

    const createdOccurrences = occurrenceRepoMock.createMany.mock.calls[0][0];
    expect(createdOccurrences).toHaveLength(1);
    expect(createdOccurrences[0]).toMatchObject({ referenceMonth: 3, referenceYear: 2027 });

    jest.useRealTimers();
  });
});
