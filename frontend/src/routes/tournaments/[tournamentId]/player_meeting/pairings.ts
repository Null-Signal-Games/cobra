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

export interface BackDetails {
  label: "Back to Players" | "Back to Pairings" | "Back to Tournament";
  path:
    | `/tournaments/${string}/organizer/players`
    | `/tournaments/${string}/organizer/rounds`
    | `/tournaments/${string}/rounds`
    | `/tournaments/${string}`;
}

export function getBackDetails(
  backTo: string | null | undefined,
  tournamentId: string | number,
): BackDetails {
  switch (backTo) {
    case "players":
      return {
        label: "Back to Players",
        path: `/tournaments/${tournamentId}/organizer/players`,
      };
    case "pairings":
      return {
        label: "Back to Pairings",
        path: `/tournaments/${tournamentId}/organizer/rounds`,
      };
    case "rounds":
      return {
        label: "Back to Pairings",
        path: `/tournaments/${tournamentId}/rounds`,
      };
    default:
      return {
        label: "Back to Tournament",
        path: `/tournaments/${tournamentId}`,
      };
  }
}
