import type { PageLoad } from "./$types";
import { loadPairings } from "../api_helper";

export const load: PageLoad = async ({ params, fetch, depends }) => {
  depends("pairings:load");

  const pairingsData = await loadPairings(parseInt(params.tournamentId), null, fetch);

  return {
    policy: pairingsData.policy,
    stages: pairingsData.stages,
  };
}
