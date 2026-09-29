import type { PageLoad } from "./$types";
import { betaApi } from "$lib/api/beta";

export const load: PageLoad = async ({ params, fetch, parent }) => {
  await parent();
  const tournamentId = parseInt(params.tournamentId, 10);
  const pairingsData = await betaApi.loadPairings(tournamentId, fetch);

  return {
    stages: pairingsData.stages,
  };
};
