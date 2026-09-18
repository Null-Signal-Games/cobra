import type { PageLoad } from "./$types";
import { loadPlayers } from "../../api_helper";

export const load: PageLoad = async ({ params, fetch, parent, url }) => {
  await parent();
  const players = await loadPlayers(parseInt(params.tournamentId, 10), fetch);

  return {
    players,
    back_to: url.searchParams.get("back_to"),
  };
};
