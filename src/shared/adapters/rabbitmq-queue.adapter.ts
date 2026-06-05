import amqp, { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

import { injectable } from 'tsyringe';

import { logger } from '@shared/utils/logger';

import { IMessageQueuePort } from '../gateways/message-queue.port';

@injectable()
export class RabbitMQQueueAdapter implements IMessageQueuePort {
  private readonly connection: AmqpConnectionManager;
  private readonly channel: ChannelWrapper;

  constructor() {
    this.connection = amqp.connect([process.env.RABBITMQ_URL as string]);
    this.channel = this.connection.createChannel({
      json: true,
      setup: async (channel: ConfirmChannel) => {
        return channel.assertQueue(process.env.QUEUE_PROCESS_TRANSACTIONS as string, {
          durable: true,
        });
      },
    });

    logger.info('Connected to RabbitMQ');
  }

  async publish<T>(queue: string, message: T): Promise<void> {
    try {
      this.channel.sendToQueue(queue, message);
    } catch (error) {
      logger.error({ message: 'Failed to publish message to RabbitMQ', error });
    }
  }

  async subscribe<T>(queue: string, handler: (message: T) => Promise<void>): Promise<void> {
    try {
      await this.channel.consume(queue, async message => {
        if (message) {
          logger.info({ data: message.content.toString() });
          const content = message?.content?.toString();
          const parsedMessage = JSON.parse(content) as T;

          await handler(parsedMessage);
          this.channel.ack(message);
        }
      });
    } catch (error) {
      logger.error({ message: 'Failed to subscribe to RabbitMQ', error });
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.channel.close();
    await this.connection.close();
  }
}
