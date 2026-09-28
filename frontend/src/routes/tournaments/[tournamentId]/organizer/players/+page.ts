import type { PageLoad } from "./$types";
import { betaApi } from "$lib/api/beta";

export const load: PageLoad = async ({ params, fetch, parent }) => {
  await parent();
  const [players, identities] = await Promise.all([
    betaApi.loadPlayers(parseInt(params.tournamentId), fetch),
    betaApi.loadIdentityNames(fetch)
  ]);

  return {
    players: players,
    identities: identities
  };
}
