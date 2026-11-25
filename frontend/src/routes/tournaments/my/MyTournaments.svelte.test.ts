import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import type { TournamentsResponse } from '#lib/api/v1ApiTypes.ts';
import { v1Api } from '#lib/api/v1.ts';
import { makeAuthUser, makeTournamentsResponse } from '#lib/testing/fixtures.ts';
import MyTournamentsPage from './+page.svelte';

vi.mock('#lib/api/v1.ts', () => ({
	v1Api: { loadTournaments: vi.fn() }
}));

function renderPage(tournamentsResponse: TournamentsResponse) {
	render(MyTournamentsPage, {
		props: {
			data: {
				user: makeAuthUser({ nrdb_username: 'jo_z' }),
				tournamentTypes: [],
				tournamentsResponse
			},
			params: {}
		}
	});
}

describe('My tournaments page', () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	afterEach(() => {
		cleanup();
	});

	it("lists the tournament organizer's tournaments, marking private ones", () => {
		renderPage(
			makeTournamentsResponse([{ name: 'Public GNK' }, { name: 'Secret GNK', private: true }])
		);

		expect(screen.getByRole('link', { name: 'Public GNK' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Secret GNK' }).parentElement).toHaveTextContent(
			'Private'
		);
		expect(screen.getByText('jo_z')).toBeInTheDocument();
	});

	it('says when they have no tournaments', () => {
		renderPage(makeTournamentsResponse([]));

		expect(screen.getByText("You haven't created any tournaments yet.")).toBeInTheDocument();
	});

	it('loads the next page of tournaments', async () => {
		vi.mocked(v1Api.loadTournaments).mockResolvedValue(
			makeTournamentsResponse([{ name: 'Older GNK' }])
		);
		renderPage({
			...makeTournamentsResponse([{ name: 'Newer GNK' }]),
			links: { next: '/api/v1/private/user/tournaments?page=2' }
		});

		await userEvent.click(screen.getAllByRole('button', { name: /Next/ })[0]);

		expect(v1Api.loadTournaments).toHaveBeenCalledWith(
			'/api/v1/private/user/tournaments?page=2'
		);
		expect(await screen.findByRole('link', { name: 'Older GNK' })).toBeInTheDocument();
		expect(screen.queryByRole('link', { name: 'Newer GNK' })).not.toBeInTheDocument();
	});
});
