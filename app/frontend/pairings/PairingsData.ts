import type { Identity } from "../identities/Identity";
import { globalMessages } from "../utils/GlobalMessageState.svelte";
import { csrfToken } from "../utils/network";
import type { ScoreReport } from "./SelfReport";

declare const Routes: {
  markdown_tournament_round_pairings_path: (
    tournamentId: number,
    roundId: number,
  ) => string;
  beta_tournament_round_pairing_path: (
    tournamentId: number,
    roundId: number,
    pairingId: number,
  ) => string;
};

export async function loadPairings(
  tournamentId: number,
): Promise<PairingsData> {
  const response = await fetch(
    `/beta/tournaments/${tournamentId}/rounds/pairings_data`,
    {
      method: "GET",
    },
  );

  const data = (await response.json()) as PairingsData;
  globalMessages.warnings = data.warnings ?? [];

  return data;
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

export async function deletePairing(
  tournamentId: number,
  roundId: number,
  pairingId: number,
): Promise<boolean> {
  const response = await fetch(
    Routes.beta_tournament_round_pairing_path(tournamentId, roundId, pairingId),
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
    },
  );

  return response.status === 200;
}

export interface PairingsContext {
  showOrganizerView: boolean;
}

export class PairingsData {
  policy = new TournamentPolicies();
  tournament = new Tournament();
  stages: Stage[] = [];
  warnings?: string[] = [];
}

export class TournamentPolicies {
  update = false;
  custom_table_numbering = false;
}

export class SharingData {
  pages: string[];

  constructor() {
    this.pages = [];
  }
}

export class Tournament {
  id = 0;
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
  view_decks: boolean;
  rounds: Round[];
}

export interface Round {
  id: number;
  number: number;
  completed: boolean;
  pairings: Pairing[];
  pairings_reported: number;
  unpaired_players?: Player[];
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

export interface SelfReport {
  report_player_id: number;
  score1: number;
  score2: number;
  intentional_draw: boolean;
  label: string | null;
}

export interface PairingPolicies {
  view_decks?: boolean;
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
  active: boolean | null = null;
}
