export interface Logger {
  info(message: string): void;
  error(message: string): void;
}

export const logger: Logger = {
  info(message) {
    console.log(`[tung] ${message}`);
  },
  error(message) {
    console.error(`[tung] ${message}`);
  },
};
