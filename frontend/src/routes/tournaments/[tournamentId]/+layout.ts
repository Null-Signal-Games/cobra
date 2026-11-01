import { betaApi } from "$lib/api/beta";
import { v1Api } from "$lib/api/v1";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ params, parent, fetch }) => {
  const { user } = await parent();
  const tournamentId = parseInt(params.tournamentId);

  const tournament = await v1Api.loadTournament(tournamentId, fetch);

  return {
    tournamentData: tournament,
    timer: await betaApi.loadCurrentRoundTimer(tournamentId, fetch),
    player: user ? await v1Api.loadPlayerByUserId(tournamentId, user.id, fetch) : null,
  };
};
