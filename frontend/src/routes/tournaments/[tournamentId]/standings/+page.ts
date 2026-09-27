import type { PageLoad } from "./$types";
import { loadStandings } from "$lib/api/classic";

export const load: PageLoad = async ({ params, fetch }) => {
  const standingsData = await loadStandings(parseInt(params.tournamentId), fetch);

  return {
    standings: standingsData,
  };
}
