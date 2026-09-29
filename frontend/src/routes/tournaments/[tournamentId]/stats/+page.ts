import type { PageLoad } from "./$types";
import { betaApi } from "$lib/api/beta";

export const load: PageLoad = async ({ params, fetch }) => {
  const tournamentId = parseInt(params.tournamentId);
  
  const statsPromise = betaApi.loadStats(tournamentId, fetch);
  const pairingsData = await betaApi.loadPairings(tournamentId, fetch);

  const hasCut =
    pairingsData.stages.length > 1 &&
    pairingsData.stages.at(-1)?.is_elimination;

  const cutStats = hasCut ? await betaApi.loadCutStats(tournamentId, fetch) : null;

  return {
    stages: pairingsData.stages,
    stats: await statsPromise,
    cutStats,
  };
};
