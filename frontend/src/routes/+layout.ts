import { loadTournamentTypes } from "$lib/api/v1";

export const load = async ({ fetch }) => {
	return {
    tournamentTypes: await loadTournamentTypes(fetch as typeof globalThis.fetch),
  };
};
