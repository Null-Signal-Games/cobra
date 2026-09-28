import type { PageLoad } from "./$types";
import { classicApi } from "$lib/api/classic";
import { authStore } from "$lib/utils/auth.svelte";

export const load: PageLoad = async ({ parent, fetch }) => {
  const { player, tournamentData } = await parent();
  const user = authStore.user;

  return {
    user: user,
    player: player,
    pairings:
      !player || !user
        ? null
        : await classicApi.loadPairingsForUser(tournamentData.tournament.id, user.id, fetch),
  };
};
