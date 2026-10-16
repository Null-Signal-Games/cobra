// Aids testability by allowing us to mock navigation in tests.
export function navigateTo(url: string) {
  window.location.href = url;
}

export interface BackDetails {
  label:
    | "Back to Players"
    | "Back to Pairings"
    | "Back to Standings"
    | "Back to Tournament";
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
    case "standings":
      return {
        label: "Back to Standings",
        path: `/tournaments/${tournamentId}/standings`,
      };
    default:
      return {
        label: "Back to Tournament",
        path: `/tournaments/${tournamentId}`,
      };
  }
}
