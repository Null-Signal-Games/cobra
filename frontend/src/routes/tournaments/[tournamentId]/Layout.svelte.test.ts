import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/svelte';
import TournamentLayout from './+layout.svelte';
import { Tournament } from '#lib/model/Tournament.ts';
import type { RoundTimer } from '#lib/model/Round.ts';
import { makeRoundTimer } from '#lib/testing/fixtures.ts';
import { createRawSnippet } from 'svelte';

vi.mock('$app/env/public', () => ({
	CLIENT_COBRA_API_ENDPOINT: 'http://localhost:3000'
}));

describe('Tournament layout', () => {
	afterEach(() => {
		cleanup();
	});

	const emptyChildren = createRawSnippet(() => ({
		render: () => '<div>Fake Container Content</div>'
	}));

	function renderLayout(tournament: Tournament, timer: RoundTimer = makeRoundTimer()) {
		return render(TournamentLayout, {
			props: {
				data: {
					user: null,
					tournamentTypes: [],
					tournamentData: {
						tournament
					},
					timer,
					player: null
				},
				children: emptyChildren
			}
		});
	}

	describe('navigation bar', () => {
		describe('when tournament has no elimination stage', () => {
			it('does not display the Bracket tab', () => {
				renderLayout(new Tournament({ id: 1, has_elimination_stage: false }));
				expect(screen.queryByRole('link', { name: 'Bracket' })).not.toBeInTheDocument();
			});
		});
		describe('when tournament has an elimination stage', () => {
			it('displays the Bracket tab', () => {
				renderLayout(new Tournament({ id: 1, has_elimination_stage: true }));
				expect(screen.getByRole('link', { name: 'Bracket' })).toBeInTheDocument();
			});
		});
	});

	describe('stream link', () => {
		it('links to a valid stream URL', () => {
			const { container } = renderLayout(
				new Tournament({ id: 1, stream_url: 'https://twitch.tv/nsg' })
			);
			expect(container.querySelector('a.stream-link')).toHaveAttribute(
				'href',
				'https://twitch.tv/nsg'
			);
		});

		it.each(['', 'twitch.tv/nsg', 'javascript:alert(1)'])('is hidden for %j', (streamUrl) => {
			const { container } = renderLayout(new Tournament({ id: 1, stream_url: streamUrl }));
			expect(container.querySelector('a.stream-link')).not.toBeInTheDocument();
		});
	});

	describe('round timer', () => {
		it('is hidden until the timer is started', () => {
			renderLayout(new Tournament({ id: 1 }), makeRoundTimer({ show: false }));
			expect(screen.queryByText(/in round/)).not.toBeInTheDocument();
		});

		it('is shown once the timer is started', () => {
			renderLayout(
				new Tournament({ id: 1 }),
				makeRoundTimer({
					show: true,
					paused: true,
					started: true,
					state: { started: true, paused: true, remaining_seconds: 600 }
				})
			);
			expect(screen.getAllByText(/in round/).length).toBeGreaterThan(0);
		});
	});
});
