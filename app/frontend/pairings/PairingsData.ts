import type { Identity } from "../identities/Identity";
import type { ScoreReport } from "./SelfReport";

declare const Routes: {
  pairings_data_tournament_rounds_path: (tournamentId: number) => string;
  markdown_tournament_round_pairings_path: (
    tournamentId: number,
    roundId: number,
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
  policy = new TournamentPolicies();
  tournament = new Tournament();
  stages: Stage[] = [];
  csrf_token = "";
}

export class SharingData {
  pages: string[] = [];
}

export class TournamentPolicies {
  update = false;
  custom_table_numbering = false;
}

export class Tournament {
  player_meeting = false;
  registration_open = false;
  registration_unlocked = false;
  self_registration = false;
  locked_players = 0;
  unlocked_players = 0;
  allow_streaming_opt_out = false;
}

export interface Stage {
  id: number;
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
  length_minutes: number;
  timer: RoundTimer;
}

export interface RoundTimer {
  running: boolean;
  paused: boolean;
  started: boolean;
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
  score1: number;
  score1_corp: number;
  score1_runner: number;
  score2: number;
  score2_corp: number;
  score2_runner: number;
  score_label: string;
  intentional_draw: boolean;
  two_for_one: boolean;
  self_reports: ScoreReport[] | null;
  reported: boolean;
  winner_game: number | null;
  loser_game: number | null;
  bracket_type: string | null;
  ui_metadata: UiMetadata;
}

export interface UiMetadata {
  row_highlighted: boolean;
}

export interface PairingPolicies {
  view_decks: boolean;
  self_report: boolean;
}

export class Player {
  id = 0;
  name = "";
  name_with_pronouns = "";
  side: string | null = null;
  user_id: number | null = null;
  side_label: string | null = null;
  corp_id: Identity | null = null;
  runner_id: Identity | null = null;
  include_in_stream = false;
}
