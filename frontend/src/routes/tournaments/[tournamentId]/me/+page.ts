import type { PageLoad } from "./$types";
import { classicApi } from "#lib/api/classic.ts";

export const load: PageLoad = async ({ parent, fetch }) => {
  const { user, player, tournamentData } = await parent();

  return {
    player: player,
    pairings:
      !player || !user
        ? null
        : await classicApi.loadPairingsForUser(tournamentData.tournament.id, user.id, fetch),
  };
};
