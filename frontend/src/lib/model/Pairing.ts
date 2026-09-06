import type { Player } from "./Player";
import type { ScoreReport } from "./ScoreReport";

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
  ui_metadata: {
    row_highlighted: boolean;
  };
}

export interface PairingPolicies {
  view_decks?: boolean;
  self_report: boolean;
}
