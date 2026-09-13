import type { PageLoad } from "./$types";
import { loadIdentityNames, loadPlayers } from "../../../api_helper";

export const load: PageLoad = async ({ params, fetch, parent }) => {
  await parent();
  const [players, identities] = await Promise.all([
    loadPlayers(parseInt(params.tournamentId), fetch),
    loadIdentityNames(fetch)
  ]);

  return {
    players: players,
    identities: identities
  };
}
