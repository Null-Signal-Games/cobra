export type Errors = Record<string, string[]>;

export class ValidationError extends Error {
  constructor(
    public errors: Errors,
    message = "Validation failed",
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
