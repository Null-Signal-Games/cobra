// Type wrapper for API response success/failure and data.
export type StatusOr<T = void, E = Error> =
  | { ok: true; status: number; data: T; error?: never }
  | { ok: false; status: number; error: E; data?: never };

// Success constructor
export function ok<T>(data: T, status = 200): StatusOr<T, never> {
  return { ok: true, status, data };
}

// Error constructor
export function err<E = Error>(error: E, status = 500): StatusOr<never, E> {
  return { ok: false, status, error };
}
