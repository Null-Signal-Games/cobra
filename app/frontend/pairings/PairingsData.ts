import type { Identity } from "../identities/Identity";

declare const Routes: {
  pairings_data_tournament_rounds_path: (tournamentId: number) => string;
  markdown_tournament_round_pairings_path: (
    tournamentId: number,
    roundId: number,
  ) => string;
  pairing_presets_tournament_round_pairing_path: (
    tournamentId: number,
    roundId: number,
    id: number,
  ) => string;
};

export async function loadPairings(
  tournamentId: number,
): Promise<PairingsData> {
  const response = await fetch(
    Routes.pairings_data_tournament_rounds_path(tournamentId),
    {
      method: "GET",
    },
  );

  return (await response.json()) as PairingsData;
}

export async function loadSharingData(
  tournamentId: number,
  roundId: number,
): Promise<SharingData> {
  const response = await fetch(
    Routes.markdown_tournament_round_pairings_path(tournamentId, roundId),
    {
      method: "GET",
    },
  );

  return (await response.json()) as SharingData;
}

export class PairingsData {
  policy: TournamentPolicies;
  tournament: Tournament;
  stages: Stage[];
  csrf_token: string;

  constructor() {
    this.policy = { update: false };
    this.tournament = new Tournament();
    this.stages = [];
    this.csrf_token = "";
  }
}

export class SharingData {
  pages: string[];

  constructor() {
    this.pages = [];
  }
}

export interface TournamentPolicies {
  update: boolean;
}

export class Tournament {
  player_meeting: boolean;
  registration_open: boolean;
  registration_unlocked: boolean;
  self_registration: boolean;
  locked_players: number;
  unlocked_players: number;

  constructor() {
    this.player_meeting = false;
    this.registration_open = false;
    this.registration_unlocked = false;
    this.self_registration = false;
    this.locked_players = 0;
    this.unlocked_players = 0;
  }
}

export interface Stage {
  name: string;
  format: string;
  is_single_sided: boolean;
  is_elimination: boolean;
  rounds: Round[];
}

export interface Round {
  id: number;
  number: number;
  completed: boolean;
  pairings: Pairing[];
  pairings_reported: number;
}

export interface PlayerSource {
  method: "winner" | "loser";
  game: number;
}

export type PredecessorMap = Record<number, PlayerSource[]>;

export interface Pairing {
  id: number;
  table_number: number;
  table_label: string;
  policy: PairingPolicies;
  player1: Player;
  player2: Player;
  score_label: string;
  intentional_draw: boolean;
  two_for_one: boolean;
  self_report: SelfReport | null;
  winner_game: number | null;
  loser_game: number | null;
  bracket_type: string | null;
  ui_metadata: UiMetadata;
}

export interface UiMetadata {
  row_highlighted: boolean;
}

export interface SelfReport {
  report_player_id: number;
  score1: number;
  score2: number;
  intentional_draw: boolean;
  label: string | null;
}

export interface PairingPolicies {
  view_decks: boolean;
  self_report: boolean;
}

export interface Player {
  id: number;
  name_with_pronouns: string;
  side: string | null;
  user_id: string | null;
  side_label: string | null;
  corp_id: Identity | null;
  runner_id: Identity | null;
}
