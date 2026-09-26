import type { Tournament, TournamentOptions, FeatureFlags } from "$lib/model/Tournament";
import type { Errors } from "$lib/utils/errors";

export interface TournamentSettingsData {
  tournament: Tournament;
  options: TournamentOptions;
  feature_flags: FeatureFlags;
  can_change_swiss_format?: boolean;
  csrf_token: string;
}

export interface TournamentCreateResponse {
  id: number;
  name: string;
  url: string;
}

export interface TournamentCreateErrorResponse {
  errors: Errors;
}

export interface Stage {
  id: number;
  tournament_id: number;
  number: number;
  format: string | null;
  table_ranges: TableRange[];
}

export interface TableRange {
  id?: number;
  stage_id: number;
  first_table: number;
  last_table: number;
}

export class StageData {
  stage: Stage;
  warning?: string;

  constructor() {
    this.stage = {
      id: -1,
      tournament_id: -1,
      number: -1,
      format: null,
      table_ranges: [],
    };
  }
}

export interface SaveStageResponse {
  url: string;
  error?: string;
}

export class ValidationError extends Error {
  constructor(public errors: string) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}
