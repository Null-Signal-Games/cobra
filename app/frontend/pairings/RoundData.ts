import { Tournament, TournamentPolicies, type Round, type Stage } from "./PairingsData";

declare const Routes: {
  round_data_tournament_round_path: (tournamentId: number, roundId: number) => string;
}

export async function loadRound(
  tournamentId: number,
  roundId: number
): Promise<RoundData> {
  const response = await fetch(
    Routes.round_data_tournament_round_path(tournamentId, roundId),
    {
      method: "GET",
    },
  );

  return (await response.json()) as RoundData;
}

export interface RoundData {
  tournament: Tournament;
  stage: Stage;
  round: Round;
  policy?: TournamentPolicies;
  csrf_token: string;
}