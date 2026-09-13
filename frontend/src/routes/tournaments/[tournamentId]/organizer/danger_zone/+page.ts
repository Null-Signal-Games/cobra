import type { PageLoad } from "./$types";
import { loadPairings } from "../../api_helper";

export const load: PageLoad = async ({ params, fetch, parent }) => {
  await parent();
  const tournamentId = parseInt(params.tournamentId);
  const pairingsData = await loadPairings(tournamentId, null, fetch);

  return {
    stages: pairingsData.stages,
  };
};
