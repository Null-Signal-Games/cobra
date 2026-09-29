import type { PageLoad } from "./$types";
import { classicApi } from "$lib/api/classic";

export const load: PageLoad = async ({ fetch }: { fetch: typeof globalThis.fetch }) => {
  return {
    tournamentSettings: await classicApi.loadNewTournament(fetch),
  };
};
