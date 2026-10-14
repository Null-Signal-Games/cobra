import type { PageLoad } from "./$types";
import { betaApi } from "$lib/api/beta";
import type { Pairing } from "$lib/model/Pairing";

export const load: PageLoad = async ({ parent, params, fetch }) => {
  const { stages } = await parent();
  const tournamentId = parseInt(params.tournamentId);
  const roundId = parseInt(params.roundId);
  const pairingId = parseInt(params.pairingId);

  let stageName = "";
  let pairing: Pairing | undefined;
  stages.forEach((s) => {
    const round = s.rounds.find((r) => r.id === roundId);
    if (!round) {
      return;
    }

    pairing = round.pairings.find((p) => p.id === pairingId);
    if (pairing) {
      stageName = s.name;
      return;
    }
  });

  return {
    stageName: stageName,
    pairing: pairing,
    player1Decks: await betaApi.loadDecks(tournamentId, pairing?.player1.id, fetch),
    player2Decks: await betaApi.loadDecks(tournamentId, pairing?.player2.id, fetch),
  }
}
