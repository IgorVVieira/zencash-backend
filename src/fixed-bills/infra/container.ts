import { container } from 'tsyringe';

import { Injections } from '@shared/types/injections';

import { FixedBillRepositoryAdapter } from '@fixed-bills/adapters/repositories/fixed-bill.repository.adapter';
import { FixedBillOccurrenceRepositoryAdapter } from '@fixed-bills/adapters/repositories/fixed-bill-occurrence.repository.adapter';
import { FixedBillController } from '@fixed-bills/controllers/fixed-bill.controller';
import { IFixedBillRepositoryPort } from '@fixed-bills/domain/repositories/fixed-bill.repository.port';
import { IFixedBillOccurrenceRepositoryPort } from '@fixed-bills/domain/repositories/fixed-bill-occurrence.repository.port';
import { CreateFixedBillUseCase } from '@fixed-bills/use-cases/create-fixed-bill/create-fixed-bill.use-case';
import { DeleteFixedBillUseCase } from '@fixed-bills/use-cases/delete-fixed-bill/delete-fixed-bill.use-case';
import { GenerateOccurrencesUseCase } from '@fixed-bills/use-cases/generate-occurrences/generate-occurrences.use-case';
import { ListFixedBillsUseCase } from '@fixed-bills/use-cases/list-fixed-bills/list-fixed-bills.use-case';
import { ListOccurrencesUseCase } from '@fixed-bills/use-cases/list-occurrences/list-occurrences.use-case';
import { UpdateFixedBillUseCase } from '@fixed-bills/use-cases/update-fixed-bill/update-fixed-bill.use-case';
import { UpdateOccurrenceUseCase } from '@fixed-bills/use-cases/update-occurrence/update-occurrence.use-case';

container.registerSingleton<IFixedBillRepositoryPort>(
  Injections.FIXED_BILL_REPOSITORY,
  FixedBillRepositoryAdapter,
);
container.registerSingleton<IFixedBillOccurrenceRepositoryPort>(
  Injections.FIXED_BILL_OCCURRENCE_REPOSITORY,
  FixedBillOccurrenceRepositoryAdapter,
);

container.registerSingleton(Injections.CREATE_FIXED_BILL_USE_CASE, CreateFixedBillUseCase);
container.registerSingleton(Injections.LIST_FIXED_BILLS_USE_CASE, ListFixedBillsUseCase);
container.registerSingleton(Injections.UPDATE_FIXED_BILL_USE_CASE, UpdateFixedBillUseCase);
container.registerSingleton(Injections.DELETE_FIXED_BILL_USE_CASE, DeleteFixedBillUseCase);
container.registerSingleton(Injections.LIST_OCCURRENCES_USE_CASE, ListOccurrencesUseCase);
container.registerSingleton(Injections.UPDATE_OCCURRENCE_USE_CASE, UpdateOccurrenceUseCase);
container.registerSingleton(Injections.GENERATE_OCCURRENCES_USE_CASE, GenerateOccurrencesUseCase);

container.registerSingleton(FixedBillController);

export { container };
