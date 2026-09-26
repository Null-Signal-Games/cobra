import type { Tournament } from "$lib/model/Tournament";

// The JSON::API response types common between all entity types.
export interface ApiResponse<T, I = never> {
  data: T[];
  included?: I[];
  links?: {
    self?: string;
    first?: string;
    last?: string;
    next?: string | null;
    prev?: string | null;
  };
  meta?: {
    stats?: {
      total?: {
        count?: number;
      };
    };
  };
}

export interface TournamentInfo {
  id: string;
  type?: string;
  attributes: Tournament;
}

export interface TournamentTypeInfo {
  id: string;
  type: string;
  attributes: {
    name: string;
    nsg_format: boolean;
  };
}

export interface Printing {
  id: string;
  type: string;
  attributes: {
    card_id: string;
    title: string;
    card_type_id: string;
    side_id: string;
    faction_id: string;
    influence_cost: number | null;
    influence_limit: number | null;
    minimum_deck_size: number | null;
  };
}

export type TournamentsResponse = ApiResponse<TournamentInfo, TournamentTypeInfo>;
export type TournamentTypesResponse = ApiResponse<TournamentTypeInfo>;
export type PrintingsResponse = ApiResponse<Printing>;
