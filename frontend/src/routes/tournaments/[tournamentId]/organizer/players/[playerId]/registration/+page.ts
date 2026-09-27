import { Deck } from "$lib/model/Deck";
import { sortCards } from "$lib/utils/decks.svelte";
import { loadDecks, loadPlayer } from "../../../../../api_helper";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch }) => {
  // Load player
  const player = await loadPlayer(parseInt(params.tournamentId), parseInt(params.playerId), fetch);

  // Load decks for current tournament
  const tournamentDecks = await loadDecks(parseInt(params.tournamentId), parseInt(params.playerId), fetch);
  const corpDeck = tournamentDecks.find((d) => d.details.side_id === "corp") ?? new Deck();
  sortCards(corpDeck.cards);
  const runnerDeck = tournamentDecks.find((d) => d.details.side_id === "runner") ?? new Deck();
  sortCards(runnerDeck.cards);

  return {
    registrationPlayer: player,
    corpDeck: corpDeck,
    runnerDeck: runnerDeck,
  };
}
