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

  if (!pairing.player1.side)
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

export function readableReportScore(report: SelfReport, player1Side: string | null, isSingleSided: boolean): string {
  if (report.score1 === 0 && report.score2 === 0) {
    return "-";
  }

  let leftScore = report.score1;
  let rightScore = report.score2;
  if (isSingleSided && player1Side === "runner") {
    leftScore = report.score2;
    rightScore = report.score1;
  }

  // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  const str = `${leftScore} - ${rightScore}`;
  const ws = winningSide(report);
  return ws !== "" ? `${str} (${ws})` : str;
}

function winningSide(report: SelfReport) {
  const corpScore = report.score1_corp + report.score2_corp;
  const runnerScore = report.score1_runner + report.score2_runner;

  if (corpScore === runnerScore) {
    return "";
  }

  return corpScore > runnerScore ? "C" : "R";
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
  self_reports: SelfReport[] | null;
  reported: boolean;
  winner_game: number | null;
  loser_game: number | null;
  bracket_type: string | null;
  ui_metadata: UiMetadata;
}

export interface UiMetadata {
  row_highlighted: boolean;
}

export class SelfReport {
  report_player_id= -1;
  score1 = 0;
  score1_corp = 0;
  score1_runner = 0;
  score2 = 0;
  score2_corp = 0;
  score2_runner = 0;
  intentional_draw = false;
  label: string | null = null;

  matches(other: SelfReport): boolean {
    return this.score1 === other.score1 && this.score2 === other.score2;
  }
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