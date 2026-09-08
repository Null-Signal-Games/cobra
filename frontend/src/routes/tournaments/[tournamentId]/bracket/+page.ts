import type { PageLoad } from "./$types";
import { loadBrackets } from "../../api_helper";

export const load: PageLoad = async ({ params, fetch }) => {
  const bracketData = await loadBrackets(parseInt(params.tournamentId), fetch);

  return {
    bracket: bracketData,
  };
}
