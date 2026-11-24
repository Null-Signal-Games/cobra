// Helpers for testing SvelteKit `load` functions (+page.ts / +layout.ts) directly.
// These run in the vitest "server" project, so name the test file `page.test.ts` / `layout.test.ts`
// (not `*.svelte.test.ts`).
//
//   const event = makeLoadEvent({ params: { slug: "TEST" } });
//   await expectRedirect(load(event), 302, "/tournaments/1");
import { isRedirect } from '@sveltejs/kit';
import { expect, vi } from 'vitest';

interface LoadEventOptions {
	params?: Record<string, string>;
	url?: string | URL;
	parentData?: Record<string, unknown>;
	fetch?: typeof globalThis.fetch;
}

// Builds the parts of a load event our loaders use. It returns `never` so it can be passed to any
// generated `PageLoad` / `LayoutLoad` without casting every field.
export function makeLoadEvent({
	params = {},
	url = 'http://localhost/',
	parentData = {},
	fetch = vi.fn<typeof globalThis.fetch>()
}: LoadEventOptions = {}): never {
	return {
		params,
		url: new URL(url),
		fetch,
		parent: vi.fn(() => Promise.resolve(parentData)),
		depends: vi.fn(),
		untrack: <T>(fn: () => T) => fn(),
		setHeaders: vi.fn(),
		route: { id: null },
		data: null
	} as never;
}

// Asserts that a load function throws a SvelteKit `redirect(status, location)`.
export async function expectRedirect(
	result: unknown,
	status: number,
	location: string
): Promise<void> {
	let thrown: unknown;
	try {
		await (typeof result === 'function' ? (result as () => unknown)() : result);
	} catch (e) {
		thrown = e;
	}

	expect(isRedirect(thrown), `expected a redirect to ${location}, got ${String(thrown)}`).toBe(
		true
	);
	expect(thrown).toMatchObject({ status, location });
}
