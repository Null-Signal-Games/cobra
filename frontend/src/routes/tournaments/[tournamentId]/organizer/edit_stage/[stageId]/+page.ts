import type { PageLoad } from "./$types";
import { classicApi } from "$lib/api/classic";

export const load: PageLoad = async ({ params, fetch, parent }) => {
  await parent();
  const tournamentId = parseInt(params.tournamentId, 10);
  const stageId = parseInt(params.stageId, 10);

  const stageData = await classicApi.loadStage(tournamentId, stageId, fetch);

  return {
    tournamentId,
    stageId,
    stageData,
  };
};
