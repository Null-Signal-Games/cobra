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
