export interface ILlmProvider {
  execute<T>(prompt: string, instructions?: string): Promise<T>;
}
