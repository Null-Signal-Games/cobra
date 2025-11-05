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

export function scorePresets(stage: Stage, pairing: Pairing) {
  if (!stage.is_elimination)
  {
    return [
      { score1_corp: 3, score2_runner: 0, score1_runner: 3, score2_corp: 0, label: '6-0' },
      { score1_corp: 3, score2_runner: 0, score1_runner: 0, score2_corp: 3, label: '3-3 (C)' },
      { score1_corp: 0, score2_runner: 3, score1_runner: 3, score2_corp: 0, label: '3-3 (R)' },
      { score1_corp: 0, score2_runner: 3, score1_runner: 0, score2_corp: 3, label: '0-6' }
    ] as Score[];
  }

  if (stage.is_single_sided) {
    return pairing.player1.side == "corp"
      ? [
          { score1_corp: 3, score2_corp: 0, score1_runner: 0, score2_runner: 0, intentional_draw: false, label: 'Corp Win' },
          { score1_corp: 1, score2_corp: 0, score1_runner: 0, score2_runner: 1, intentional_draw: false, label: 'Tie' },
          { score1_corp: 1, score2_corp: 0, score1_runner: 0, score2_runner: 1, intentional_draw: true, label: 'Intentional Draw' },
          { score1_corp: 0, score2_corp: 0, score1_runner: 0, score2_runner: 3, intentional_draw: false, label: 'Runner Win' }
        ] as Score[]
      : [
          { score1_corp: 0, score2_corp: 3, score1_runner: 0, score2_runner: 0, intentional_draw: false, label: 'Corp Win' },
          { score1_corp: 0, score2_corp: 1, score1_runner: 1, score2_runner: 0, intentional_draw: false, label: 'Tie' },
          { score1_corp: 0, score2_corp: 1, score1_runner: 1, score2_runner: 0, intentional_draw: true, label: 'Intentional Draw' },
          { score1_corp: 0, score2_corp: 0, score1_runner: 3, score2_runner: 0, intentional_draw: false, label: 'Runner Win' }
        ] as Score[];
  }

  if (stage.is_elimination && !pairing.player1.side)
  {
    return pairing.player1.side == "corp"
      ? [
          { score1: 3, score2: 0, score1_corp: 3, score2_runner: 0, score1_runner: 0, score2_corp: 0, label: '3-0', extra_self_report_label: "#{pairing.player1.name} wins" },
          { score1: 0, score2: 3, score1_corp: 0, score2_runner: 3, score1_runner: 0, score2_corp: 0, label: '0-3', extra_self_report_label: "#{pairing.player2.name} wins" }
        ] as Score[]
      : [
          { score1: 0, score1_corp: 0, score1_runner: 0, score2: 3, score2_corp: 3, score2_runner: 0, label: '3-0', extra_self_report_label: "#{pairing.player2.name} wins" },
          { score1: 3, score1_corp: 0, score1_runner: 3, score2: 0, score2_corp: 0, score2_runner: 0, label: '0-3', extra_self_report_label: "#{pairing.player1.name} wins" }
        ] as Score[];
  }

  return [
    { score1: 3, score2: 0, score1_corp: 0, score2_runner: 0, score1_runner: 0, score2_corp: 0, label: '3-0' },
    { score1: 0, score2: 3, score1_corp: 0, score2_runner: 0, score1_runner: 0, score2_corp: 0, label: '0-3' }
  ] as Score[];
}

export class PairingsData {
  policy: TournamentPolicies;
  tournament: Tournament;
  stages: Stage[];
  csrf_token: string;

  constructor() {
    this.policy = { update: false, custom_table_numbering: false };
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
  custom_table_numbering: boolean;
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
  score1: number,
  score2: number,
  score_label: string;
  intentional_draw: boolean;
  two_for_one: boolean;
  self_report: SelfReport | null;
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

export interface Score {
  score1?: number;
  score2?: number;
  score1_corp: number;
  score2_runner: number;
  score1_runner: number;
  score2_corp: number;
  label?: string;
  intentional_draw?: boolean;
  two_for_one?: boolean;
  extra_self_report_label?: string;
}