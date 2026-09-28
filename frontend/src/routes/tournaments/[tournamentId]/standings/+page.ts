import type { PageLoad } from "./$types";
import { classicApi } from "$lib/api/classic";

export const load: PageLoad = async ({ params, fetch }) => {
  const standingsData = await classicApi.loadStandings(parseInt(params.tournamentId), fetch);

  return {
    standings: standingsData,
  };
}
