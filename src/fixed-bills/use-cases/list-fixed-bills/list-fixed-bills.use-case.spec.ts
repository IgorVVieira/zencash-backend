import { baseRepository, BaseRepositoryMock } from '@shared/test/mocks/base-repository';

import { FixedBillRecurrence } from '@fixed-bills/domain/entities/fixed-bill.entity';
import { ListFixedBillsUseCase } from '@fixed-bills/use-cases/list-fixed-bills/list-fixed-bills.use-case';

describe('ListFixedBillsUseCase', () => {
  type SutTypes = {
    sut: ListFixedBillsUseCase;
    fixedBillRepoMock: BaseRepositoryMock & {
      findAllActiveByUserId: jest.Mock;
      softDelete: jest.Mock;
    };
  };

  const makeSut = (): SutTypes => {
    const fixedBillRepoMock = {
      ...baseRepository,
      findAllActiveByUserId: jest.fn(),
      softDelete: jest.fn(),
    };
    const sut = new ListFixedBillsUseCase(fixedBillRepoMock);
    return { sut, fixedBillRepoMock };
  };

  it('should return active bills for the user', async () => {
    const { sut, fixedBillRepoMock } = makeSut();

    fixedBillRepoMock.findAllActiveByUserId.mockResolvedValue([
      {
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
        categoryName: null,
        categoryColor: null,
        createdAt: new Date('2026-06-01'),
        updatedAt: new Date('2026-06-01'),
      },
    ]);

    const result = await sut.execute({ userId: 'user-1' });

    expect(fixedBillRepoMock.findAllActiveByUserId).toHaveBeenCalledWith('user-1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Água');
  });

  it('should return empty array when user has no bills', async () => {
    const { sut, fixedBillRepoMock } = makeSut();

    fixedBillRepoMock.findAllActiveByUserId.mockResolvedValue([]);

    const result = await sut.execute({ userId: 'user-1' });

    expect(result).toEqual([]);
  });
});
