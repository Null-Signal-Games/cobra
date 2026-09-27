import type { PageLoad } from "./$types";
import { loadNewTournament } from "$lib/api/classic";

export const load: PageLoad = async ({ fetch }: { fetch: typeof globalThis.fetch }) => {
  return {
    tournamentSettings: await loadNewTournament(fetch),
  };
};
