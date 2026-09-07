import type { PageLoad } from "./$types";
import { loadStandings } from "../../api_helper";

export const load: PageLoad = async ({ params, fetch }) => {
  const standingsData = await loadStandings(parseInt(params.tournamentId), fetch);

  return {
    standings: standingsData,
  };
}
