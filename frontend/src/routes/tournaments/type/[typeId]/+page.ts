import type { PageLoad } from "./$types";
import { loadTournaments, tournamentsApiUrl } from "$lib/api/v1";

export const load: PageLoad = async ({ params, fetch }) => {
  return {
    tournamentsResponse: await loadTournaments(tournamentsApiUrl(params.typeId), fetch),
  };
}
