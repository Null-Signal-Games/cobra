import type { PageLoad } from "./$types";
import { classicApi } from "$lib/api/classic";

export const load: PageLoad = async ({ params, fetch, parent }) => {
  await parent(); // Ensures organizer authorization in +layout.ts runs first
  const tournamentId = parseInt(params.tournamentId);
  const settings = await classicApi.loadTournamentSettings(tournamentId, fetch);
  return {
    tournamentSettings: settings,
  };
}
