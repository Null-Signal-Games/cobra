import type { PageLoad } from "./$types";
import { betaApi } from "#lib/api/beta.ts";
import { Deck } from "#lib/model/Deck.ts";
import { sortCards } from "#lib/utils/decks.svelte.ts";

export const load: PageLoad = async ({ params, fetch }) => {
  const tournamentId = parseInt(params.tournamentId);
  const playerId = parseInt(params.playerId);

  const player = await betaApi.loadPlayer(tournamentId, playerId, fetch);
  const decks = await betaApi.loadDecks(tournamentId, playerId, fetch);

  const corpDeck = decks.find((d) => d.details.side_id === "corp") ?? new Deck("corp");
  sortCards(corpDeck.cards);
  const runnerDeck = decks.find((d) => d.details.side_id === "runner") ?? new Deck("runner");
  sortCards(runnerDeck.cards);

  return {
    playerName: player.name,
    corpDeck: corpDeck,
    runnerDeck: runnerDeck,
  };
}
