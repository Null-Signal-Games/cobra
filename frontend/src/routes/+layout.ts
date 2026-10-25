import type { LayoutLoad } from "./$types";
import { v1Api } from "$lib/api/v1";
import { authStore } from "$lib/utils/auth.svelte";

export const load: LayoutLoad = async ({ fetch }) => {
  // Resolve the user per request so server-rendered pages never share auth state.
  const [user, tournamentTypes] = await Promise.all([
    authStore.checkAuth(fetch),
    v1Api.loadTournamentTypes(fetch),
  ]);

  return {
    user,
    tournamentTypes,
  };
};
