import type { PageLoad } from "./$types";
import { loadPairings, loadStats, loadCutStats } from "../api_helper";

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
