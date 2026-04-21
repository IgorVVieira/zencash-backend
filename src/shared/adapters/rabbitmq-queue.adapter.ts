import client, { Channel, ChannelModel } from 'amqplib';
import { injectable } from 'tsyringe';

import { logger } from '@shared/utils/logger';

import { IMessageQueuePort } from '../gateways/message-queue.port';

@injectable()
export class RabbitMQQueueAdapter implements IMessageQueuePort {
  private connection: ChannelModel;
  private channel: Channel;
  private static connected: boolean = false;

  async connect(): Promise<void> {
    if (RabbitMQQueueAdapter.connected) {
      return;
    }
    try {
      this.connection = await client.connect(process.env.RABBITMQ_URL as string);

      this.channel = await this.connection.createChannel();
      RabbitMQQueueAdapter.connected = true;
      logger.info('Connected to RabbitMQ');
    } catch (error) {
      logger.error({ message: 'Failed to connect to RabbitMQ', error });
      RabbitMQQueueAdapter.connected = false;
      throw error;
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
    await this.channel.assertQueue(queue, { durable: true });
    try {
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
}
