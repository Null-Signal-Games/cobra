import type { LayoutLoad } from "./$types";
import { loadTournamentTypes } from "$lib/api/v1";

export const load: LayoutLoad = async ({ fetch }) => {
  return {
    tournamentTypes: await loadTournamentTypes(fetch),
  };
};
