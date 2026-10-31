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
export interface TournamentResponse {
  data: TournamentInfo;
}
export type TournamentTypesResponse = ApiResponse<TournamentTypeInfo>;
export type PrintingsResponse = ApiResponse<Printing>;

export interface UserInfo {
  id: string;
  type?: string;
  attributes: {
    nrdb_id: number;
    nrdb_username: string;
  };
}

export interface CurrentUserResponse {
  data: UserInfo;
}

export interface IdentityInfo {
  id: string;
  type?: string;
  attributes: {
    name: string;
    autocomplete: string;
    faction: string;
    nrdb_code: string;
    side: string;
  };
}

export type IdentitiesResponse = ApiResponse<IdentityInfo>;

export interface PlayerAttributes {
  tournament_id: number;
  user_id: number;
  name: string;
  pronouns?: string | null;
  active: boolean | null;
  seed?: number | null;
  fixed_table_number?: number | null;
  manual_seed?: number | null;
  first_round_bye?: boolean;
  include_in_stream?: boolean;
  registration_locked?: boolean;
  corp_identity_id?: number | null;
  runner_identity_id?: number | null;
}

export interface PlayerInfo {
  id: string;
  type?: string;
  attributes: PlayerAttributes;
}

export type PlayersResponse = ApiResponse<PlayerInfo, IdentityInfo>;
