export interface IMessageQueuePort {
  publish<T>(queue: string, message: T): Promise<void>;
  subscribe<T>(queue: string, handler: (message: T) => Promise<void>): Promise<void>;
  close(): Promise<void>;
}
