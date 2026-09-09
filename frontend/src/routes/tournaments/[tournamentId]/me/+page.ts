import type { PageLoad } from "./$types";
import { loadPairings } from "../api_helper";
import { authStore } from "$lib/utils/auth.svelte";

export const load: PageLoad = async ({ parent, params, fetch }) => {
  const { player, tournamentData } = await parent();
  const user = authStore.user;

  return {
    user: user,
    player: player,
    pairings:
      !player || !user
        ? null
        : await loadPairings(tournamentData.tournament.id, user.id, fetch),
  };
};
