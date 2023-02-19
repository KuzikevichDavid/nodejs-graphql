export class NotFound extends Error {
  constructor(operation: string, message: string) {
    super(`Fail during ${operation}.`);
    this.name = 'Not found entity';
    this.message = message;
  }
}
