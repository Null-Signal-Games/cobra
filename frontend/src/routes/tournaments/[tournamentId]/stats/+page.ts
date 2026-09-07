import type { PageLoad } from "./$types";
import { loadPairings, loadStats, loadCutStats } from "../api_helper";

export const load: PageLoad = async ({ params, fetch }) => {
  const tournamentId = parseInt(params.tournamentId);
  
  const [pairingsData, stats, cutStats] = await Promise.all([
    loadPairings(tournamentId, null, fetch),
    loadStats(tournamentId, fetch),
    loadCutStats(tournamentId, fetch),
  ]);
  return {
    stages: pairingsData.stages,
    stats,
    cutStats,
  };
}
