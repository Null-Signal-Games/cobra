import type { PageLoad } from "./$types";
import { loadRound } from "../../../api_helper";

export const load: PageLoad = async ({ params, fetch }) => {
  const roundData = await loadRound(parseInt(params.tournamentId), parseInt(params.roundId), fetch);

  return {
    tournament: roundData.tournament,
    stage: roundData.stage,
    round: roundData.round,
    policy: roundData.policy,
  };
}
