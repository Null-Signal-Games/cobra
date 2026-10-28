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

export interface NewPairing {
  table_number: number | null;
  player1_id: number;
  side: string;
  player2_id: number;
}

export interface PairingByNameRow {
  pairingId: number;
  tableNumber: number;
  playerName: string;
  opponentName: string;
}

export function formatPlayerDisplay(
  player: Player | undefined | null,
  isSingleSided: boolean,
): string {
  if (!player) {
    return "(Bye)";
  }
  const name = player.name_with_pronouns || player.name || "(Bye)";
  if (isSingleSided && player.side_label) {
    const trimmed = player.side_label.trim();
    return `${name} ${trimmed}`;
  }
  return name;
}

export function generatePairingsByName(
  pairings: Pairing[],
  format: string,
  isSingleSided = false,
): PairingByNameRow[] {
  const isSingle = format === "single_sided_swiss" || isSingleSided;
  const rows: PairingByNameRow[] = [];

  for (const pairing of pairings) {
    const p1Name = formatPlayerDisplay(pairing.player1, isSingle);
    const p2Name = formatPlayerDisplay(pairing.player2, isSingle);

    rows.push({
      pairingId: pairing.id,
      tableNumber: pairing.table_number,
      playerName: p1Name,
      opponentName: p2Name,
    });

    rows.push({
      pairingId: pairing.id,
      tableNumber: pairing.table_number,
      playerName: p2Name,
      opponentName: p1Name,
    });
  }

  return rows.sort((a, b) => {
    const aLower = a.playerName.toLowerCase();
    const bLower = b.playerName.toLowerCase();
    if (aLower < bLower) return -1;
    if (aLower > bLower) return 1;
    return a.tableNumber - b.tableNumber;
  });
}
