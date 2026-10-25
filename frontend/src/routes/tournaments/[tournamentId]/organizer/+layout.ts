import type { LayoutLoad } from "./$types";
import { redirect } from "@sveltejs/kit";

export const load: LayoutLoad = async ({ parent }) => {
  // Only let the organizer in
  const { user, tournamentData } = await parent();
  if (user?.id !== tournamentData.tournament.user_id) {
    redirect(307, `/tournaments/${tournamentData.tournament.id}`);
  }

  return {};
}
