import { describe, expect, it } from 'vitest';
import { makeLoadEvent } from '#lib/testing/loaders.ts';
import { load } from './+page.ts';

describe('not found load', () => {
	it('passes the shortcode through', () => {
		const result = load(
			makeLoadEvent({ url: 'http://localhost/tournaments/not_found?code=NOSUCH' })
		);

		expect(result).toMatchObject({ code: 'NOSUCH' });
		expect(typeof (result as { icon: unknown }).icon).toBe('string');
	});

	it('uses an empty code when none is given', () => {
		const result = load(makeLoadEvent({ url: 'http://localhost/tournaments/not_found' }));

		expect(result).toMatchObject({ code: '' });
	});
});
