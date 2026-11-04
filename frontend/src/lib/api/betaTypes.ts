import type { Round } from "#lib/model/Round.ts";
import type { Stage } from "#lib/model/Stage.ts";
import { Tournament, TournamentPolicies } from "#lib/model/Tournament.ts";

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
