import type { Deck } from "./Deck";
import { Identity } from "./Identity";
import type { Tournament, TournamentPolicies } from "./Tournament";

export interface PlayersData {
  tournament: Tournament;
  tournamentPolicies: TournamentPolicies;
  activePlayers: Player[];
  droppedPlayers: Player[];
}

export class Player {
  id = 0;
  name = "";
  pronouns = "";
  name_with_pronouns = "";
  user_id = 0;
  corp_id = new Identity();
  runner_id = new Identity();
  registration_locked = false;
  include_in_stream = false;
  active: boolean | null = null;
  first_round_bye = false;
  manual_seed: number | null = null;
  fixed_table_number: number | null = null;
  side: string | null = null;
  side_label: string | null = null;
  corp_deck?: Deck;
  runner_deck?: Deck;
}
