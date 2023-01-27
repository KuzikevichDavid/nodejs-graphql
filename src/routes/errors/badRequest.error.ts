export class BadRequest extends Error {
  constructor(operation: string, message: string) {
    super(`Fail during ${operation}.`);
    this.name = 'Bad ruquest';
    this.message = message;
  }
}
