/**
 * Returns a normalized URL if `value` is an absolute http(s) URL, otherwise null.
 *
 * Use this before rendering user-supplied URLs as links: a value like "example.com" would
 * otherwise be treated as a relative path, and schemes like "javascript:" must never be linked.
 */
export function httpUrlOrNull(value: string | null | undefined): string | null {
  // Browser URL parsing is a bit more lenient than the ruby validation. "http:example.com" is ~equivalent to "http://example.com/"
  // Require a literal "http(s)://" here prefix to match the backend's validation.
  if (!value || !/^https?:\/\//i.test(value)) return null;

  try {
    const url = new URL(value);
    return url.hostname ? url.toString() : null;
  } catch {
    return null;
  }
}
