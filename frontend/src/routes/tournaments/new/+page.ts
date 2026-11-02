import type { PageLoad } from "./$types";
import { classicApi } from "#lib/api/classic.ts";

export const load: PageLoad = async ({ fetch }: { fetch: typeof globalThis.fetch }) => {
  return {
    tournamentSettings: await classicApi.loadNewTournament(fetch),
  };
};
