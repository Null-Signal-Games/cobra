import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { goto } from '$app/navigation';
import { v1Api } from '#lib/api/v1.ts';
import { makeTournamentsResponse } from '#lib/testing/fixtures.ts';
import HomePage from './+page.svelte';

vi.mock('#lib/api/v1.ts', () => ({
	v1Api: { loadTournaments: vi.fn() }
}));
vi.mock('$app/navigation', () => ({ goto: vi.fn() }));

const user = userEvent.setup();

function todayString() {
	const today = new Date();
	return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
}

describe('Home page', () => {
	beforeEach(() => {
		vi.resetAllMocks();
		vi.mocked(v1Api.loadTournaments).mockResolvedValue(makeTournamentsResponse([]));
	});

	afterEach(() => {
		cleanup();
	});

	it("asks for today's tournaments", async () => {
		render(HomePage);

		await screen.findByText('None');
		const url = vi.mocked(v1Api.loadTournaments).mock.calls[0][0] ?? '';
		expect(new URL(url, 'http://localhost').searchParams.get('filter[date]')).toBe(
			todayString()
		);
	});

	it("lists today's tournaments", async () => {
		vi.mocked(v1Api.loadTournaments).mockResolvedValue(
			makeTournamentsResponse([{ name: 'Today GNK' }, { name: 'Today Store Champs' }])
		);

		render(HomePage);

		expect(await screen.findByRole('link', { name: 'Today GNK' })).toBeInTheDocument();
		expect(screen.getByRole('link', { name: 'Today Store Champs' })).toBeInTheDocument();
	});

	it('shows None when there are no tournaments today', async () => {
		render(HomePage);

		expect(await screen.findByText('None')).toBeInTheDocument();
	});

	it('links to more tournaments', () => {
		render(HomePage);

		expect(screen.getByRole('link', { name: /More tournaments/ })).toHaveAttribute(
			'href',
			'/tournaments'
		);
	});

	it('goes to the cleaned-up shortcode', async () => {
		render(HomePage);

		await user.type(screen.getByLabelText('Got a shortcode?'), '  abcd ');
		await user.click(screen.getByRole('button', { name: /Go to tournament/ }));

		expect(goto).toHaveBeenCalledWith('/ABCD');
	});

	it('does nothing with a blank shortcode', async () => {
		render(HomePage);

		await user.type(screen.getByLabelText('Got a shortcode?'), '   ');
		await user.click(screen.getByRole('button', { name: /Go to tournament/ }));

		expect(goto).not.toHaveBeenCalled();
	});
});
