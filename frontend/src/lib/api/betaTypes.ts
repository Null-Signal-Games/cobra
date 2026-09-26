import type { Round } from "$lib/model/Round";
import type { Stage } from "$lib/model/Stage";
import { Tournament, TournamentPolicies } from "$lib/model/Tournament";

export class PairingsData {
  policy = new TournamentPolicies();
  stages: Stage[] = [];
  warnings?: string[] = [];
}

export interface RoundData {
  tournament: Tournament;
  stage: Stage;
  round: Round;
  policy?: TournamentPolicies;
  warnings?: string[];
}

export interface TournamentData {
  tournament: Tournament,
  csrf_token: string,
}
