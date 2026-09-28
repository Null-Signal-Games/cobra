import type { PageLoad } from "./$types";
import { classicApi } from "$lib/api/classic";

export const load: PageLoad = async ({ params, fetch }) => {
  const bracketData = await classicApi.loadBrackets(parseInt(params.tournamentId), fetch);

  return {
    bracket: bracketData,
  };
}
