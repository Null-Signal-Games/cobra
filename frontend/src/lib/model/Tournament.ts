export class Tournament {
  id = 0;
  name = "";
  slug: string | null = null;
  abr_code: string | null = null;
  private = false;
  user_id = 0;
  tournament_organizer = "";
  date = "";
  time_zone: string | null = null;
  registration_starts: string | null = null;
  tournament_starts: string | null = null;
  organizer_contact: string | null = null;
  event_link: string | null = null;
  stream_url = "";
  description: string | null = null;
  additional_prizes_description: string | null = null;
  official_prize_kit_id: number | null = null;
  official_prize_kit_name: string | null = null;
  stage = "";
  manual_seed = false;
  self_registration = false;
  nrdb_deck_registration = false;
  decklist_required = false;
  allow_self_reporting = false;
  allow_streaming_opt_out = false;
  all_players_unlocked = false;
  any_player_unlocked = false;
  registration_closed: boolean | null = null;
  swiss_deck_visibility = SwissDeckVisibility.Private;
  cut_deck_visibility = CutDeckVisibility.Private;
  swiss_format = "";
  tournament_type_id: number | null = null;
  format_id: number | null = null;
  format_name: string | null = null;
  deckbuilding_restriction_id: number | null = null;
  deckbuilding_restriction_name: string | null = null;
  card_set_id: number | null = null;
  active_player_count = 0;
  dropped_player_count = 0;
  created_at = "";
  updated_at = "";

  constructor(init?: Partial<Tournament>) {
    Object.assign(this, init);
  }
}

export interface TournamentOptions {
  tournament_types: { id: number; name: string }[];
  formats: { id: number; name: string }[];
  card_sets: { id: number; name: string }[];
  deckbuilding_restrictions: { id: number; name: string }[];
  time_zones: { id: string; name: string }[];
  official_prize_kits: { id: number; name: string }[];
}

export class TournamentPolicies {
  update = false;
  custom_table_numbering = false;
}

export interface FeatureFlags {
  allow_self_reporting?: boolean;
}

export enum SwissDeckVisibility {
  Private = "swiss_decks_private",
  Open = "swiss_decks_open",
  Public = "swiss_decks_public",
}

export enum CutDeckVisibility {
  Private = "cut_decks_private",
  Open = "cut_decks_open",
  Public = "cut_decks_public",
}

export function swissFormatDisplayString(format: string) {
  if (format === "single_sided") {
    return "Single-sided";
  } else if (format === "double_sided") {
    return "Double-sided";
  }
  return "Unknown";
}

export function emptyTournamentOptions(): TournamentOptions {
  return {
    tournament_types: [],
    formats: [],
    card_sets: [],
    deckbuilding_restrictions: [],
    time_zones: [],
    official_prize_kits: [],
  };
}
