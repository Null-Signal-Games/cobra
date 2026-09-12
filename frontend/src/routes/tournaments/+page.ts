import type { PageLoad } from "./$types";
import { loadTournaments, tournamentsApiUrl } from "$lib/api/v1";

export const load: PageLoad = async ({ fetch }) => {
  return {
    tournamentsResponse: await loadTournaments(tournamentsApiUrl(), fetch),
  };
}
