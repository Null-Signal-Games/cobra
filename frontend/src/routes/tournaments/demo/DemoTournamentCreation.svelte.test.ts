import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import DemoTournamentCreation from './+page.svelte';
import { classicApi } from '#lib/api/classic.ts';
import { navigateTo } from '#lib/utils/navigation.ts';
import { ValidationError } from '#lib/utils/errors.ts';
import type { AuthUser } from '#lib/utils/auth.svelte.ts';
import type { PageProps } from './$types';

vi.mock('$app/env/public', () => ({
	CLIENT_COBRA_API_ENDPOINT: 'http://localhost:3000'
}));

vi.mock('#lib/api/classic.ts', () => ({
	classicApi: {
		loadNewDemoTournament: vi.fn(),
		createDemoTournament: vi.fn()
	}
}));

vi.mock('#lib/utils/navigation.ts', () => ({
	navigateTo: vi.fn()
}));

describe('DemoTournamentCreation', () => {
	const mockTournamentData = {
		tournament: {
			name: 'Test Demo Tournament',
			swiss_format: 'single_sided',
			num_players: 16,
			num_first_round_byes: 1,
			assign_ids: true
		},
		csrf_token: 'fake-csrf-token'
	};

	const enabledUser: AuthUser = {
		id: 1,
		nrdb_id: 1,
		nrdb_username: 'demo_user',
		features: { create_demo_tournaments: true }
	};

	function renderPage(user: AuthUser | null = enabledUser) {
		const data = { user, tournamentTypes: [] } as unknown as PageProps['data'];
		return render(DemoTournamentCreation, { props: { data, params: {} } });
	}

	beforeEach(() => {
		cleanup();
		vi.clearAllMocks();
		vi.mocked(classicApi.loadNewDemoTournament).mockResolvedValue(mockTournamentData);
	});

	it('renders the demo tournament creation form', async () => {
		renderPage();

		await waitFor(() => {
			expect(screen.getByLabelText(/tournament name/i)).toBeInTheDocument();
		});

		expect(screen.getByText('Create a demo tournament')).toBeInTheDocument();
		expect(screen.getByLabelText(/Number of Players/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/swiss format/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/number of first round byes/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/assign random ids for players\?/i)).toBeInTheDocument();
		expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument();
	});

	it('loads initial tournament data on mount', async () => {
		renderPage();

		await waitFor(() => {
			expect(classicApi.loadNewDemoTournament).toHaveBeenCalledOnce();
		});
	});

	it('shows a loading spinner', async () => {
		vi.mocked(classicApi.loadNewDemoTournament).mockImplementation(
			() =>
				new Promise(() => {
					// This promise intentionally never resolves to test loading state
				})
		);

		renderPage();

		await waitFor(() => {
			expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
		});
		expect(screen.queryByLabelText(/tournament name/i)).not.toBeInTheDocument();
	});

	it('successfully creates a tournament', async () => {
		const mockResponse = {
			id: 123,
			name: 'Test Demo Tournament',
			url: '/tournaments/123/rounds'
		};

		vi.mocked(classicApi.createDemoTournament).mockResolvedValue(mockResponse);

		renderPage();

		await waitFor(() => {
			expect(screen.getByLabelText(/tournament name/i)).toBeInTheDocument();
		});

		// Fill in the form
		const nameInput = screen.getByLabelText(/tournament name/i);
		await fireEvent.input(nameInput, {
			target: { value: 'Test Demo Tournament' }
		});
		screen.getByLabelText(/swiss format/i).focus();
		await userEvent.keyboard('{ArrowDown}');
		await userEvent.click(screen.getByText('Double-sided'));
		const numPlayersInput = screen.getByLabelText(/number of players/i);
		await fireEvent.input(numPlayersInput, { target: { value: '16' } });
		const numByesInput = screen.getByLabelText(/number of first round byes/i);
		await fireEvent.input(numByesInput, { target: { value: '1' } });
		const assignIdsCheckbox = screen.getByLabelText(/assign random ids for players\?/i);
		await fireEvent.click(assignIdsCheckbox);

		// Submit the form
		const submitButton = screen.getByRole('button', {
			name: /create/i
		});
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(classicApi.createDemoTournament).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'Test Demo Tournament',
					swiss_format: 'double_sided'
				})
			);
		});

		// Check that redirect happens
		await waitFor(() => {
			expect(navigateTo).toHaveBeenCalledWith('/tournaments/123/rounds');
		});
	});

	it('handles validation errors', async () => {
		const validationError = new ValidationError({
			name: ['You must provide a name for the tournament'],
			num_players: ['Number of players is required'],
			num_first_round_byes: ['Number of byes must be a number']
		});
		vi.mocked(classicApi.createDemoTournament).mockRejectedValue(validationError);

		renderPage();

		await waitFor(() => {
			expect(screen.getByLabelText(/tournament name/i)).toBeInTheDocument();
		});

		const numByesInput = screen.getByLabelText(/number of first round byes/i);
		await fireEvent.input(numByesInput, {
			target: { value: 'plural is not a number' }
		});

		// Submit the form
		const submitButton = screen.getByRole('button', {
			name: /create/i
		});
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(
				screen.getByText('You must provide a name for the tournament')
			).toBeInTheDocument();
			expect(screen.getByText('Number of players is required')).toBeInTheDocument();
			expect(screen.getByText('Number of byes must be a number')).toBeInTheDocument();
		});
	});

	it('handles unexpected errors', async () => {
		vi.mocked(classicApi.createDemoTournament).mockRejectedValue(new Error('Network error'));

		renderPage();

		await waitFor(() => {
			expect(screen.getByLabelText(/tournament name/i)).toBeInTheDocument();
		});

		// Submit the form
		const submitButton = screen.getByRole('button', {
			name: /create/i
		});
		await fireEvent.click(submitButton);

		await waitFor(() => {
			expect(screen.getByText(/an unexpected error occurred/i)).toBeInTheDocument();
		});
	});

	it('tells logged-out users to log in and does not load the form', () => {
		renderPage(null);

		expect(
			screen.getByText(/must be logged in to create a demo tournament/i)
		).toBeInTheDocument();
		expect(classicApi.loadNewDemoTournament).not.toHaveBeenCalled();
	});

	it('explains when demo tournaments are not enabled and does not load the form', () => {
		renderPage({ ...enabledUser, features: {} });

		expect(
			screen.getByText(/demo tournaments are not enabled for your account/i)
		).toBeInTheDocument();
		expect(classicApi.loadNewDemoTournament).not.toHaveBeenCalled();
	});

	it('shows an error when the form fails to load', async () => {
		vi.mocked(classicApi.loadNewDemoTournament).mockRejectedValue(
			new Error('401 Unauthorized')
		);

		renderPage();

		await waitFor(() => {
			expect(
				screen.getByText(/unable to load the demo tournament form/i)
			).toBeInTheDocument();
		});
		expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
	});
});
