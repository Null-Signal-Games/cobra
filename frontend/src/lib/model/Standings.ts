import type { Identity } from "./Identity";


export interface StandingsData {
  manual_seed: boolean;
  stages: Stage[];
}

// TODO: consolidate classes and interfaces between this and src/lib/model/Stage.ts
export interface Stage {
  format: string;
  rounds_complete: number;
  any_decks_viewable: boolean;
}

export interface SwissStage extends Stage {
  standings: SwissStanding[];
}

export interface CutStage extends Stage {
  standings: CutStanding[];
}

export interface StandingsPlayer {
  id: number;
  active: boolean;
  name_with_pronouns: string;
  corp_id: Identity | null;
  runner_id: Identity | null;
}

export interface SwissStanding {
  player: StandingsPlayer;
  policy: StandingPolicies;
  position: number;
  points: number;
  sos: string;
  extended_sos: string;
  bye_points: number;
  corp_points: number;
  runner_points: number;
  manual_seed: number | null;
  side_bias: number | null;
}

export interface CutStanding {
  player: StandingsPlayer | null;
  policy: StandingPolicies;
  seed: number;
  position: number;
}

export interface StandingPolicies {
  view_decks: boolean;
}
