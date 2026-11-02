import type { PageLoad } from "./$types";
import { classicApi } from "#lib/api/classic.ts";

export const load: PageLoad = async ({ params, fetch }) => {
  const standingsData = await classicApi.loadStandings(parseInt(params.tournamentId), fetch);

  return {
    standings: standingsData,
  };
}
