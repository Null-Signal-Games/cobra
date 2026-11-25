import { beforeEach, describe, expect, it, vi } from 'vitest';
import { v1Api } from '#lib/api/v1.ts';
import { makeAuthUser, makeTournamentsResponse } from '#lib/testing/fixtures.ts';
import { expectRedirect, makeLoadEvent } from '#lib/testing/loaders.ts';
import { load } from './+page.ts';

vi.mock('#lib/api/v1.ts', () => ({
	v1Api: { loadUserTournaments: vi.fn() }
}));
vi.mock('$app/env/public', () => ({ CLIENT_COBRA_API_ENDPOINT: 'http://localhost:3000' }));

describe('my tournaments load', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("loads the tournament organizer's tournaments", async () => {
		const user = makeAuthUser({ nrdb_username: 'jo_z' });
		const response = makeTournamentsResponse([{ name: 'Some GNK' }]);
		vi.mocked(v1Api.loadUserTournaments).mockResolvedValue(response);
		const fetch = vi.fn<typeof globalThis.fetch>();

		const result = await load(makeLoadEvent({ fetch, parentData: { user } }));

		expect(v1Api.loadUserTournaments).toHaveBeenCalledWith(fetch);
		expect(result).toEqual({ user, tournamentsResponse: response });
	});

	it('sends a signed out user to log in', async () => {
		const event = makeLoadEvent({
			url: 'http://localhost/tournaments/my',
			parentData: { user: null }
		});

		await expectRedirect(
			load(event),
			307,
			'http://localhost:3000/oauth/login?return_to=http%3A%2F%2Flocalhost%2Ftournaments%2Fmy'
		);
		expect(v1Api.loadUserTournaments).not.toHaveBeenCalled();
	});
});
