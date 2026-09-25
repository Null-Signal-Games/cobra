import type { Card, CardSearchOption, Deck, NrdbDeck } from "$lib/model/Deck";
import type { Printing, PrintingsResponse } from "$lib/utils/api_types";
import { quoteCsvValue } from "./files";
import { globalMessages } from "./GlobalMessageState.svelte";

const printings = $state(new Map<string, Printing>());

export async function getPrintings(altFetch = fetch) {
  if (printings.size === 0) {
    const response = await loadPrintings("page[size]=10000", altFetch);
    if (response) {
      response.data.forEach((p) => printings.set(p.id, p));
    }
  }

  return printings;
}

export function convertNrdbDeck(
  nrdbDeck: NrdbDeck,
  printings: Map<string, Printing>,
): Deck {
  let identityNrdbId = "";
  let identity: Printing | null = null;
  const cards: Card[] = [];
  for (const card of nrdbDeck.cards) {
    const printing = printings.get(card.id);
    if (!printing) {
      continue;
    }

    if (printing.attributes.card_type_id.endsWith("identity")) {
      identityNrdbId = card.id;
      identity = printing;
      continue;
    }

    cards.push({
      id: 0,
      deck_id: nrdbDeck.id,
      title: printing.attributes.title,
      quantity: card.count,
      influence: (printing.attributes.influence_cost ?? 0) * card.count,
      nrdb_card_id: printing.attributes.card_id,
      created_at: "",
      updated_at: "",
      nrdb_printing_id: card.id,
      card_type_id: printing.attributes.card_type_id,
      faction_id: printing.attributes.faction_id,
      influence_cost: printing.attributes.influence_cost ?? 0,
    });
  }

  return {
    details: {
      id: 0,
      player_id: 0,
      side_id: identity?.attributes.side_id ?? "",
      name: nrdbDeck.name,
      identity_title: identity?.attributes.title ?? "",
      min_deck_size: identity?.attributes.minimum_deck_size ?? 0,
      max_influence: identity?.attributes.influence_limit ?? 0,
      nrdb_uuid: nrdbDeck.uuid,
      identity_nrdb_card_id: identity?.attributes.card_id ?? "",
      created_at: nrdbDeck.date_creation,
      updated_at: nrdbDeck.date_update,
      identity_nrdb_printing_id: identityNrdbId,
      user_id: 0,
      faction_id: identity?.attributes.faction_id ?? "",
      mine: true,
      player_name: "",
    },
    cards: cards,
  };
}

export function deckCsv(decks: Deck[]) {
  const headerCsv =
    decks
      .map((deck) => `Player,${quoteCsvValue(deck.details.player_name ?? "")},`)
      .join(",,") +
    "\n" +
    decks
      .map((deck) => `Deck,${quoteCsvValue(deck.details.name ?? "")},`)
      .join(",,") +
    "\n\n" +
    decks.map(() => "Min,Identity,Max").join(",,") +
    "\n" +
    decks
      .map(
        (deck) =>
          `${deck.details.min_deck_size},${quoteCsvValue(deck.details.identity_title ?? "")},${deck.details.max_influence}`,
      )
      .join(",,");

  const maxCards = decks.reduce(
    (max, deck) => Math.max(max, deck.cards.length),
    0,
  );
  let cardCsv = decks.map(() => "Qty,Card Name,Inf").join(",,");
  for (const i of Array(maxCards).keys()) {
    cardCsv +=
      "\n" +
      decks
        .map((deck: Deck) => {
          if (i >= deck.cards.length) {
            return ",,";
          }
          const influence =
            deck.cards[i].influence > 0 &&
            deck.cards[i].faction_id !== deck.details.faction_id
              ? deck.cards[i].influence
              : "";
          return i < deck.cards.length
            ? `${deck.cards[i].quantity},${quoteCsvValue(deck.cards[i].title)},${influence}`
            : ",,";
        })
        .join(",,");
  }

  cardCsv +=
    "\n\n" +
    decks
      .map((deck) => {
        const totalQuantity = deck.cards.reduce(
          (total: number, card: Card) => total + card.quantity,
          0,
        );
        const totalInfluence = deck.cards
          .filter((card: Card) => card.faction_id !== deck.details.faction_id)
          .reduce((total: number, card: Card) => total + card.influence, 0);
        return `${totalQuantity},Totals,${totalInfluence}`;
      })
      .join(",,");

  // "\ufeff" lets Excel know it's Unicode encoded
  return `\ufeff${headerCsv}\n\n${cardCsv}`;
}

export function sortCards(cards: Card[]) {
  cards.sort((a, b) => {
    if (a.card_type_id != b.card_type_id) {
      return a.card_type_id < b.card_type_id ? -1 : 1;
    }

    if (a.title !== b.title) {
      return a.title < b.title ? -1 : 1;
    }

    return 0;
  });
}

export async function loadPrintings(query?: string, altFetch = fetch) {
  let queryString =
    "fields[printings]=card_id,card_type_id,title,side_id,faction_id,minimum_deck_size,influence_limit,influence_cost";
  if (queryString) {
    queryString += `&${query}`;
  }

  try {
    const response = await altFetch(
      `https://api.netrunnerdb.com/api/v3/public/printings?${queryString}`,
      { method: "GET" },
    );

    if (response.status === 200) {
      return (await response.json()) as PrintingsResponse;
    }

    globalMessages.errors.push(
      `Failed to load printings: ${response.statusText}`,
    );
  } catch (e) {
    const err = e as Error;
    globalMessages.errors.push(`Failed to load printings: ${err.message}`);
  }

  return null;
}

export function transformCardLookup(
  response: PrintingsResponse,
): CardSearchOption[] {
  return response.data.map((p) => {
    return { label: p.attributes.title, value: p };
  });
}
