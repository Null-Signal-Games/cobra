import type { PageLoad } from "./$types";
import { loadPairings } from "../../../api_helper";

export const load: PageLoad = async ({ params, fetch, parent }) => {
  await parent();
  const tournamentId = parseInt(params.tournamentId, 10);
  const roundId = parseInt(params.roundId, 10);

  const pairingsData = await loadPairings(tournamentId, null, fetch);
  let round = null;
  let stage = null;

  for (const s of pairingsData.stages) {
    const found = s.rounds.find((r) => r.id === roundId);
    if (found) {
      round = found;
      stage = s;
      break;
    }
  }

  return {
    round,
    stage,
    policy: pairingsData.policy,
  };
};
