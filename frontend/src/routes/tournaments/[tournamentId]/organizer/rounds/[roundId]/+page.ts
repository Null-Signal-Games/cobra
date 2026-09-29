import type { PageLoad } from "./$types";
import { betaApi } from "$lib/api/beta";

export const load: PageLoad = async ({ params, fetch }) => {
  const roundData = await betaApi.loadRound(parseInt(params.tournamentId), parseInt(params.roundId), fetch);

  return {
    stage: roundData.stage,
    round: roundData.round,
    policy: roundData.policy,
  };
}
