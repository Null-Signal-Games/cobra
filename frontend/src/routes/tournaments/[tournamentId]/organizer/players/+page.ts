import type { PageLoad } from "./$types";
import { betaApi } from "#lib/api/beta.ts";
import { v1Api } from "#lib/api/v1.ts";

export const load: PageLoad = async ({ params, fetch, parent }) => {
  await parent();
  const [players, identities] = await Promise.all([
    betaApi.loadPlayers(parseInt(params.tournamentId), fetch),
    v1Api.loadIdentityNames(fetch)
  ]);

  return {
    players: players,
    identities: identities
  };
}
