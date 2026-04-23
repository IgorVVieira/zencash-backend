import client, { Channel, ChannelModel } from 'amqplib';
import { injectable } from 'tsyringe';

import { logger } from '@shared/utils/logger';

import { IMessageQueuePort } from '../gateways/message-queue.port';

@injectable()
export class RabbitMQQueueAdapter implements IMessageQueuePort {
  private connection: ChannelModel;
  private channel: Channel;
  private static connected: boolean = false;
  private static readonly MAX_RETRIES = 5;
  private static readonly RETRY_DELAY_MS = 3000;

  async connect(): Promise<void> {
    if (RabbitMQQueueAdapter.connected) {
      return;
    }

    for (let attempt = 1; attempt <= RabbitMQQueueAdapter.MAX_RETRIES; attempt++) {
      try {
        this.connection = await client.connect(process.env.RABBITMQ_URL as string);
        this.channel = await this.connection.createChannel();
        RabbitMQQueueAdapter.connected = true;
        logger.info('Connected to RabbitMQ');
        return;
      } catch (error) {
        logger.warn({
          message: `RabbitMQ connection attempt ${attempt}/${RabbitMQQueueAdapter.MAX_RETRIES} failed`,
          error,
        });
        if (attempt === RabbitMQQueueAdapter.MAX_RETRIES) {
          RabbitMQQueueAdapter.connected = false;
          throw error;
        }
        await new Promise(res => setTimeout(res, RabbitMQQueueAdapter.RETRY_DELAY_MS));
      }
    }
  }

  async publish<T>(queue: string, message: T): Promise<void> {
    if (!RabbitMQQueueAdapter.connected) {
      await this.connect();
    }

    try {
      await this.channel.assertQueue(queue, { durable: true });
      this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    } catch (error) {
      logger.error({ message: 'Failed to publish message to RabbitMQ', error });
      throw error;
    }
  }

  async subscribe<T>(queue: string, handler: (message: T) => Promise<void>): Promise<void> {
    if (!RabbitMQQueueAdapter.connected) {
      await this.connect();
    }

    try {
      await this.channel.assertQueue(queue, { durable: true });
      await this.channel.consume(queue, async message => {
        if (message) {
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
    if (RabbitMQQueueAdapter.connected) {
      await this.channel.close();
      await this.connection.close();
      RabbitMQQueueAdapter.connected = false;
    }
  }
}
