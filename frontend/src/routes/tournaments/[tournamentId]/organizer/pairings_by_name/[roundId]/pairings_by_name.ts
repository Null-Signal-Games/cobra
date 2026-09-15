import type { Pairing } from "$lib/model/Pairing";
import type { Player } from "$lib/model/Player";

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
