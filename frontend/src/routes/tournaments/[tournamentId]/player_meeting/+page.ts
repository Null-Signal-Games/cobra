import type { PageLoad } from "./$types";
import type { Player } from "$lib/model/Player";
import { v1Api } from "$lib/api/v1";
import { v1Adapter } from "$lib/model/v1Adapter";

export const load: PageLoad = async ({ params, fetch, parent, url }) => {
  await parent();

  const players: Player[] = [];
  const response = (await v1Api.loadPlayers(parseInt(params.tournamentId), undefined, fetch))
  response.data.forEach((p) => {
    players.push(v1Adapter.adaptPlayer(p));
  });

  return {
    players: players,
    back_to: url.searchParams.get("back_to"),
  };
};
