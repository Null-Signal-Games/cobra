import type { LayoutLoad } from "./$types";
import { betaApi } from "$lib/api/beta";

export const load: LayoutLoad = async ({ params, fetch }) => {
  const pairingsData = await betaApi.loadPairings(parseInt(params.tournamentId), fetch);

  return {
    policy: pairingsData.policy,
    stages: pairingsData.stages,
  };
}
