import { deckRequestObject, type Deck } from "./Deck";
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

export function playerRequestObject(player: Player) {
  return {
    name: player.name,
    pronouns: player.pronouns,
    corp_identity: player.corp_id.name,
    runner_identity: player.runner_id.name,
    include_in_stream: player.include_in_stream,
    first_round_bye: player.first_round_bye,
    manual_seed: player.manual_seed,
    fixed_table_number: player.fixed_table_number,
    corp_deck: player.corp_deck ? deckRequestObject(player.corp_deck) : undefined,
    runner_deck: player.runner_deck ? deckRequestObject(player.runner_deck) : undefined,
  };
}
