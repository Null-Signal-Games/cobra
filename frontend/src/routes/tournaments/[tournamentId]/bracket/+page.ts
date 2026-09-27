import type { PageLoad } from "./$types";
import { loadBrackets } from "$lib/api/classic";

export const load: PageLoad = async ({ params, fetch }) => {
  const bracketData = await loadBrackets(parseInt(params.tournamentId), fetch);

  return {
    bracket: bracketData,
  };
}
