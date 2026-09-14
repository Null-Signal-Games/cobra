import type { PageLoad } from "./$types";
import { loadPlayers } from "../../api_helper";

export const load: PageLoad = async ({ params, fetch, parent }) => {
  await parent();
  const players = await loadPlayers(parseInt(params.tournamentId, 10), fetch);

  return {
    players,
  };
};
