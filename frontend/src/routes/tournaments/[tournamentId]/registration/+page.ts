import { Deck } from "$lib/model/Deck";
import { convertNrdbDeck, getPrintings } from "$lib/utils/decks.svelte";
import { loadDecks, loadNrdbDecks } from "../../api_helper";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ params, fetch, parent }) => {
  const parentData = await parent();

  // Load decks from NRDB
  const nrdbDecks = parentData.player
    ? loadNrdbDecks(parseInt(params.tournamentId), parentData.player.id, fetch)
      .then(async (nrdbDecks) => {
        let decks: Deck[] = [];
        if (nrdbDecks.length > 0) {
          const printings = await getPrintings(fetch);
          if (printings.size > 0) {
            decks = nrdbDecks.map((d) => convertNrdbDeck(d, printings));
          }
        }
        return decks;
      })
    : Promise.resolve([]);
  
  // Load decks for current tournament
  const tournamentDecks = parentData.player
    ? await loadDecks(parseInt(params.tournamentId), parentData.player.id, fetch)
    : [];

  return {
    nrdbDecks: nrdbDecks,
    originalCorpDeck: tournamentDecks.find((d) => d.details.side_id === "corp") ?? new Deck(),
    originalRunnerDeck: tournamentDecks.find((d) => d.details.side_id === "runner") ?? new Deck(),
  };
}
