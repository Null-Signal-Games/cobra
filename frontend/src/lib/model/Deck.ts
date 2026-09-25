import type { Printing } from "$lib/utils/api_types";

export interface Card {
  id: number;
  deck_id: number;
  title: string;
  quantity: number;
  influence: number;
  nrdb_card_id: string;
  created_at: string;
  updated_at: string;
  nrdb_printing_id: string | null;
  card_type_id: string;
  faction_id: string;
  influence_cost: number;
}

export class DeckDetails {
  id = 0;
  player_id: number | null = null;
  side_id: string | null = null;
  name: string | null = null;
  identity_title: string | null = null;
  min_deck_size: number | null = null;
  max_influence: number | null = null;
  nrdb_uuid: string | null = null;
  identity_nrdb_card_id: string | null = null;
  created_at = "";
  updated_at = "";
  identity_nrdb_printing_id: string | null = null;
  user_id: number | null = null;
  faction_id: string | null = null;
  mine: boolean | null = null;
  player_name: string | null = null;
}

export class Deck {
  details = new DeckDetails();
  cards: Card[] = [];
}

export interface NrdbCard {
  id: string;
  count: number;
  printing?: Printing;
}

export interface NrdbDeck {
  id: number;
  uuid: string;
  date_creation: string;
  date_update: string;
  name: string;
  description: string;
  mwl_code: string;
  tags: string;
  cards: NrdbCard[];
}

export interface CardSearchOption {
  label: string;
  value: Printing;
}
