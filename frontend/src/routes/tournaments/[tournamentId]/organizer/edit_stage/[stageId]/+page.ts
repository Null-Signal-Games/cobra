import type { PageLoad } from "./$types";
import { loadStage } from "./StageSettings";

export const load: PageLoad = async ({ params, fetch, parent }) => {
  await parent();
  const tournamentId = parseInt(params.tournamentId, 10);
  const stageId = parseInt(params.stageId, 10);

  const stageData = await loadStage(tournamentId, stageId, fetch);

  return {
    tournamentId,
    stageId,
    stageData,
  };
};
