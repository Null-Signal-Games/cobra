import type { Identity } from "./Identity";

export interface IdStats {
  identity: Identity;
  count: number;
}

export interface FactionStats {
  name: string;
  count: number;
}

export interface CutIdStats {
  identity: Identity;
  numSwissPlayers: number;
  numCutPlayers: number;
  cutConversion: number;
}

export interface CutFactionStats {
  name: string;
  numSwissPlayers: number;
  numCutPlayers: number;
  cutConversion: number;
}

export interface StageStats {
  num_players: number;
  corp: {
    ids: IdStats[];
    factions: FactionStats[];
  };
  runner: {
    ids: IdStats[];
    factions: FactionStats[];
  };
}

export interface Stats {
  swiss: StageStats;
  elim: StageStats;
}

export interface CutStats {
  corp: {
    ids: CutIdStats[];
    factions: CutFactionStats[];
  };
  runner: {
    ids: CutIdStats[];
    factions: CutFactionStats[];
  };
}
