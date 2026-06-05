import { baseRepository, BaseRepositoryMock } from '@shared/test/mocks/base-repository';
import { EntityNotFoundError } from '@shared/errors/entity-not-found.error';

import { FixedBillRecurrence } from '@fixed-bills/domain/entities/fixed-bill.entity';
import { DeleteFixedBillUseCase } from '@fixed-bills/use-cases/delete-fixed-bill/delete-fixed-bill.use-case';

describe('DeleteFixedBillUseCase', () => {
  type SutTypes = {
    sut: DeleteFixedBillUseCase;
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
    const sut = new DeleteFixedBillUseCase(fixedBillRepoMock, occurrenceRepoMock);
    return { sut, fixedBillRepoMock, occurrenceRepoMock };
  };

  it('should soft-delete the bill and all its future pending occurrences', async () => {
    const { sut, fixedBillRepoMock, occurrenceRepoMock } = makeSut();

    fixedBillRepoMock.findOne.mockResolvedValue(existingBill);
    fixedBillRepoMock.softDelete.mockResolvedValue(undefined);
    occurrenceRepoMock.deletePendingByBillId.mockResolvedValue(undefined);

    await sut.execute({ id: 'bill-1', userId: 'user-1' });

    expect(fixedBillRepoMock.softDelete).toHaveBeenCalledWith('bill-1', 'user-1');
    expect(occurrenceRepoMock.deletePendingByBillId).toHaveBeenCalledWith('bill-1');
  });

  it('should throw EntityNotFoundError when bill does not belong to user', async () => {
    const { sut, fixedBillRepoMock } = makeSut();

    fixedBillRepoMock.findOne.mockResolvedValue({ ...existingBill, userId: 'other-user' });

    await expect(sut.execute({ id: 'bill-1', userId: 'user-1' })).rejects.toThrow(
      EntityNotFoundError,
    );
  });
});
