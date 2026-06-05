import { baseRepository, BaseRepositoryMock } from '@shared/test/mocks/base-repository';
import { EntityNotFoundError } from '@shared/errors/entity-not-found.error';

import { OccurrenceStatus } from '@fixed-bills/domain/entities/fixed-bill-occurrence.entity';
import { UpdateOccurrenceUseCase } from '@fixed-bills/use-cases/update-occurrence/update-occurrence.use-case';

describe('UpdateOccurrenceUseCase', () => {
  type SutTypes = {
    sut: UpdateOccurrenceUseCase;
    occurrenceRepoMock: BaseRepositoryMock & {
      findByPeriod: jest.Mock;
      findByBillAndPeriod: jest.Mock;
      deleteFuturePendingByBillId: jest.Mock;
      deletePendingByBillId: jest.Mock;
    };
  };

  const existingOccurrence = {
    id: 'occ-1',
    userId: 'user-1',
    fixedBillId: 'bill-1',
    status: OccurrenceStatus.PENDING,
    paidAmount: null,
    transactionId: null,
    dueDate: new Date('2026-06-10'),
    referenceMonth: 6,
    referenceYear: 2026,
  };

  const makeSut = (): SutTypes => {
    const occurrenceRepoMock = {
      ...baseRepository,
      findByPeriod: jest.fn(),
      findByBillAndPeriod: jest.fn(),
      deleteFuturePendingByBillId: jest.fn(),
      deletePendingByBillId: jest.fn(),
    };
    const sut = new UpdateOccurrenceUseCase(occurrenceRepoMock);
    return { sut, occurrenceRepoMock };
  };

  it('should mark occurrence as PAID with paidAmount', async () => {
    const { sut, occurrenceRepoMock } = makeSut();

    occurrenceRepoMock.findOne.mockResolvedValue(existingOccurrence);
    occurrenceRepoMock.update.mockResolvedValue({
      ...existingOccurrence,
      status: OccurrenceStatus.PAID,
      paidAmount: 148,
    });

    await sut.execute({ id: 'occ-1', userId: 'user-1', status: 'PAID', paidAmount: 148 });

    expect(occurrenceRepoMock.update).toHaveBeenCalledWith(
      'occ-1',
      expect.objectContaining({ status: 'PAID', paidAmount: 148 }),
    );
  });

  it('should revert PAID occurrence to PENDING and clear paidAmount and transactionId', async () => {
    const { sut, occurrenceRepoMock } = makeSut();

    occurrenceRepoMock.findOne.mockResolvedValue({
      ...existingOccurrence,
      status: OccurrenceStatus.PAID,
      paidAmount: 148,
      transactionId: 'tx-1',
    });
    occurrenceRepoMock.update.mockResolvedValue({
      ...existingOccurrence,
      status: OccurrenceStatus.PENDING,
      paidAmount: null,
      transactionId: null,
    });

    await sut.execute({ id: 'occ-1', userId: 'user-1', status: 'PENDING' });

    expect(occurrenceRepoMock.update).toHaveBeenCalledWith(
      'occ-1',
      expect.objectContaining({ status: 'PENDING', paidAmount: null, transactionId: null }),
    );
  });

  it('should throw EntityNotFoundError when occurrence does not belong to user', async () => {
    const { sut, occurrenceRepoMock } = makeSut();

    occurrenceRepoMock.findOne.mockResolvedValue({ ...existingOccurrence, userId: 'other-user' });

    await expect(
      sut.execute({ id: 'occ-1', userId: 'user-1', status: 'PAID', paidAmount: 100 }),
    ).rejects.toThrow(EntityNotFoundError);
  });
});
