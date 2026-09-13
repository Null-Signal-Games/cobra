import type { LayoutLoad } from "./$types";
import { authStore } from "$lib/utils/auth.svelte";
import { redirect } from "@sveltejs/kit";

export const load: LayoutLoad = async ({ parent, fetch }) => {
  // Only let the organizer in
  const parentData = await parent();
  const user = await authStore.checkAuth(fetch);
  if (user?.id !== parentData.tournamentData.tournament.user_id) {
    redirect(307, `/tournaments/${parentData.tournamentData.tournament.id}`);
  }

  return {};
}
