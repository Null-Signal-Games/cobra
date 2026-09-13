import type { PageLoad } from "./$types";
import { loadTournamentSettings } from "../../api_helper";

export const load: PageLoad = async ({ params, fetch, parent }) => {
  await parent(); // Ensures organizer authorization in +layout.ts runs first
  const tournamentId = parseInt(params.tournamentId);
  const settings = await loadTournamentSettings(tournamentId, fetch);
  return {
    tournamentSettings: settings,
  };
}
