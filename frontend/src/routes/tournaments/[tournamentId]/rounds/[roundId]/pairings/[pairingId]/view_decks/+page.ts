import type { PageLoad } from "./$types";
import { betaApi } from "$lib/api/beta";
import { Player } from "$lib/model/Player";
import { Deck } from "$lib/model/Deck";
import { sortCards } from "$lib/utils/decks.svelte";

export const load: PageLoad = async ({ parent, params, fetch }) => {
  const { stages } = await parent();
  const tournamentId = parseInt(params.tournamentId);
  const roundId = parseInt(params.roundId);
  const pairingId = parseInt(params.pairingId);

  const props = {
    stageName: "",
    tableLabel: "",
    corpPlayer: new Player(),
    corpPlayerDeck: new Deck("corp"),
    runnerPlayer: new Player(),
    runnerPlayerDeck: new Deck("runner"),
  };
  for (const stage of stages) {
    const round = stage.rounds.find((r) => r.id === roundId);
    if (!round) {
      continue;
    }

    const pairing = round.pairings.find((p) => p.id === pairingId);
    if (!pairing) {
      continue;
    }

    props.stageName = stage.name;
    props.tableLabel = pairing.table_label;

    if (pairing.player1.side === "corp") {
      props.corpPlayer = pairing.player1;
      props.runnerPlayer = pairing.player2;
    } else {
      props.corpPlayer = pairing.player2;
      props.runnerPlayer = pairing.player1;
    }

    const corpDeck = (await betaApi.loadDecks(tournamentId, props.corpPlayer.id, fetch))
      .find((d) => d.details.side_id === "corp");
    if (corpDeck) {
      props.corpPlayerDeck = corpDeck;
      sortCards(props.corpPlayerDeck.cards);
    }

    const runnerDeck = (await betaApi.loadDecks(tournamentId, props.runnerPlayer.id, fetch))
      .find((d) => d.details.side_id === "runner");
    if (runnerDeck) {
      props.runnerPlayerDeck = runnerDeck;
      sortCards(props.runnerPlayerDeck.cards);
    }
  }

  return props;
}
