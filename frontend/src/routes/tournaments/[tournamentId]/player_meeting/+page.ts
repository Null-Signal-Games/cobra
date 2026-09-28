import type { PageLoad } from "./$types";
import { betaApi } from "$lib/api/beta";

export const load: PageLoad = async ({ params, fetch, parent, url }) => {
  await parent();
  const players = await betaApi.loadPlayers(parseInt(params.tournamentId, 10), fetch);

  return {
    players,
    back_to: url.searchParams.get("back_to"),
  };
};
