import { container } from 'tsyringe';

import { RabbitMQQueueAdapter } from '@shared/adapters/rabbitmq-queue.adapter';
import { Injections } from '@shared/types/injections';

import { TransactionImportConsumerUseCase } from '@transactions/use-cases/transaction-import-consumer/transaction-import-consumer.use-case';

export async function startConsumers(): Promise<void> {
  const consumer = container.resolve<TransactionImportConsumerUseCase>(
    Injections.TRANSACTION_IMPORT_CONSUMER_USE_CASE,
  );

  await consumer.start();
}

export async function stopQueue(): Promise<void> {
  const queue = container.resolve<RabbitMQQueueAdapter>(Injections.MESSAGE_QUEUE_PORT);

  await queue.close();
}
