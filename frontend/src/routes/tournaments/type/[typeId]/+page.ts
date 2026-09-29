import type { PageLoad } from "./$types";
import { v1Api } from "$lib/api/v1";

export const load: PageLoad = async ({ params, fetch }) => {
  return {
    tournamentsResponse: await v1Api.loadTournaments(v1Api.tournamentsApiUrl(params.typeId), fetch),
  };
}
