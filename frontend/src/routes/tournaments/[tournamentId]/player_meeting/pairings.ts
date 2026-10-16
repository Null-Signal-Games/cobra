import type { Player } from "$lib/model/Player";

export function createPlayerMeetingPairings(players: Player[]): [Player, Player | undefined][] {
  const sorted = [...players].sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase()),
  );

  const pairings: [Player, Player | undefined][] = [];
  for (let i = 0; i < sorted.length; i += 2) {
    pairings.push([sorted[i], sorted[i + 1]]);
  }

  return pairings;
}
