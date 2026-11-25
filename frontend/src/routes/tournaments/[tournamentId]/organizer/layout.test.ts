import { describe, expect, it } from 'vitest';
import {
	makeAuthUser,
	makeTournament,
	TOURNAMENT_ORGANIZER_USER_ID
} from '#lib/testing/fixtures.ts';
import { expectRedirect, makeLoadEvent } from '#lib/testing/loaders.ts';
import { load } from './+layout.ts';

describe('organizer layout load', () => {
	const tournamentData = { tournament: makeTournament({ id: 7 }) };

	function loadAs(user: ReturnType<typeof makeAuthUser> | null) {
		return load(makeLoadEvent({ parentData: { user, tournamentData } }));
	}

	it('lets the tournament organizer in', async () => {
		await expect(loadAs(makeAuthUser({ id: TOURNAMENT_ORGANIZER_USER_ID }))).resolves.toEqual(
			{}
		);
	});

	it('sends another player to the tournament page', async () => {
		await expectRedirect(loadAs(makeAuthUser({ id: 1 })), 307, '/tournaments/7');
	});

	it('sends a signed out user to the tournament page', async () => {
		await expectRedirect(loadAs(null), 307, '/tournaments/7');
	});
});
