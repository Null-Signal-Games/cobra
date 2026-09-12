import type { PageLoad } from "./$types";
import { loadStats, loadCutStats } from "$lib/api/cobraBeta";
import { loadPairings } from "$lib/api/cobraBeta";

export const load: PageLoad = async ({ params, fetch }) => {
  const tournamentId = parseInt(params.tournamentId);
  
  const statsPromise = loadStats(tournamentId, fetch);
  const pairingsData = await loadPairings(tournamentId, null, fetch);

  const hasCut =
    pairingsData.stages.length > 1 &&
    pairingsData.stages.at(-1)?.is_elimination;

  const cutStats = hasCut ? await loadCutStats(tournamentId, fetch) : null;

  return {
    stages: pairingsData.stages,
    stats: await statsPromise,
    cutStats,
  };
};
