import { authStore } from "$lib/utils/auth.svelte";
import { betaApi } from "$lib/api/beta";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ params, fetch }) => {
  const user = await authStore.checkAuth(fetch);
  const tournamentId = parseInt(params.tournamentId);

  const tournament = await betaApi.loadTournament(tournamentId, fetch);

  return {
    tournamentData: tournament,
    timer: await betaApi.loadCurrentRoundTimer(tournamentId, fetch),
    player: user ? await betaApi.loadPlayerByUserId(tournamentId, user.id, fetch) : null,
  };
};
