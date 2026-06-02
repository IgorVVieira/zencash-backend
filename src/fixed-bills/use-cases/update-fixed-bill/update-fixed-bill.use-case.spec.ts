import { baseRepository, BaseRepositoryMock } from '@shared/test/mocks/base-repository';
import { EntityNotFoundError } from '@shared/errors/entity-not-found.error';

import { FixedBillRecurrence } from '@fixed-bills/domain/entities/fixed-bill.entity';
import { UpdateFixedBillUseCase } from '@fixed-bills/use-cases/update-fixed-bill/update-fixed-bill.use-case';

describe('UpdateFixedBillUseCase', () => {
  type SutTypes = {
    sut: UpdateFixedBillUseCase;
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

  const existingBill = {
    id: 'bill-1',
    userId: 'user-1',
    name: 'Água',
    amount: 150,
    recurrence: FixedBillRecurrence.MONTHLY,
    dueDay: 10,
    dueMonth: null,
    matchKeywords: ['COPASA'],
    isActive: true,
    categoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
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
    const sut = new UpdateFixedBillUseCase(fixedBillRepoMock, occurrenceRepoMock);
    return { sut, fixedBillRepoMock, occurrenceRepoMock };
  };

  it('should update name/amount/matchKeywords without touching occurrences', async () => {
    const { sut, fixedBillRepoMock, occurrenceRepoMock } = makeSut();

    fixedBillRepoMock.findOne.mockResolvedValue(existingBill);
    fixedBillRepoMock.update.mockResolvedValue({
      ...existingBill,
      name: 'Água COPASA',
      amount: 160,
    });

    await sut.execute({ id: 'bill-1', userId: 'user-1', name: 'Água COPASA', amount: 160 });

    expect(fixedBillRepoMock.update).toHaveBeenCalled();
    expect(occurrenceRepoMock.deleteFuturePendingByBillId).not.toHaveBeenCalled();
    expect(occurrenceRepoMock.createMany).not.toHaveBeenCalled();
  });

  it('should regenerate future PENDING occurrences when dueDay changes', async () => {
    const { sut, fixedBillRepoMock, occurrenceRepoMock } = makeSut();

    jest.useFakeTimers().setSystemTime(new Date('2026-06-01'));

    fixedBillRepoMock.findOne.mockResolvedValue(existingBill);
    fixedBillRepoMock.update.mockResolvedValue({ ...existingBill, dueDay: 15 });
    occurrenceRepoMock.deleteFuturePendingByBillId.mockResolvedValue(undefined);
    occurrenceRepoMock.createMany.mockResolvedValue([]);

    await sut.execute({ id: 'bill-1', userId: 'user-1', dueDay: 15 });

    expect(occurrenceRepoMock.deleteFuturePendingByBillId).toHaveBeenCalledWith('bill-1', 6, 2026);
    expect(occurrenceRepoMock.createMany).toHaveBeenCalled();

    jest.useRealTimers();
  });

  it('should throw EntityNotFoundError when bill does not belong to user', async () => {
    const { sut, fixedBillRepoMock } = makeSut();

    fixedBillRepoMock.findOne.mockResolvedValue({ ...existingBill, userId: 'other-user' });

    await expect(sut.execute({ id: 'bill-1', userId: 'user-1', name: 'New name' })).rejects.toThrow(
      EntityNotFoundError,
    );
  });
});
