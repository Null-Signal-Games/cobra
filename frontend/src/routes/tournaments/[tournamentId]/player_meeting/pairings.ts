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

// Keep the details for what page to go back to and the label for the button in here instead of putting it in the URL.
export interface BackDetails {
  label: "Back to Players" | "Back to Pairings";
  path:
    | `/tournaments/${string}/organizer/players`
    | `/tournaments/${string}/organizer/rounds`
    | `/tournaments/${string}/rounds`;
}

export function getBackDetails(
  previousPath: string | null | undefined,
  tournamentId: string | number,
): BackDetails {
  if (previousPath?.includes("/players")) {
    return {
      label: "Back to Players",
      path: `/tournaments/${tournamentId}/organizer/players`,
    };
  }
  if (previousPath?.includes("/organizer/rounds")) {
    return {
      label: "Back to Pairings",
      path: `/tournaments/${tournamentId}/organizer/rounds`,
    };
  }
  return {
    label: "Back to Pairings",
    path: `/tournaments/${tournamentId}/rounds`,
  };
}
