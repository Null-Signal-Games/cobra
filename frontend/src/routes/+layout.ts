import type { LayoutLoad } from "./$types";
import { v1Api } from "$lib/api/v1";

export const load: LayoutLoad = async ({ fetch }) => {
  return {
    tournamentTypes: await v1Api.loadTournamentTypes(fetch),
  };
};
