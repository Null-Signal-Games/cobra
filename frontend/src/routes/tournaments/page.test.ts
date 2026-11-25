import { beforeEach, describe, expect, it, vi } from 'vitest';
import { v1Api } from '#lib/api/v1.ts';
import { makeTournamentsResponse } from '#lib/testing/fixtures.ts';
import { makeLoadEvent } from '#lib/testing/loaders.ts';
import { load } from './+page.ts';

vi.mock('#lib/api/v1.ts', () => ({
	v1Api: {
		loadTournaments: vi.fn(),
		tournamentsApiUrl: vi.fn(() => '/api/v1/public/tournaments?default')
	}
}));

describe('tournaments list load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('loads the default tournaments list', async () => {
		const response = makeTournamentsResponse([{ name: 'Some GNK' }]);
		vi.mocked(v1Api.loadTournaments).mockResolvedValue(response);
		const fetch = vi.fn<typeof globalThis.fetch>();

		const result = await load(makeLoadEvent({ fetch }));

		expect(v1Api.loadTournaments).toHaveBeenCalledWith(
			'/api/v1/public/tournaments?default',
			fetch
		);
		expect(result).toEqual({ tournamentsResponse: response });
	});
});
