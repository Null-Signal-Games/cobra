export type Errors = Record<string, string[]>;

declare const Routes: {
  new_form_tournaments_path: () => string;
  edit_form_tournament_path: (id: number) => string;
  api_v1_public_tournament_path: (tournamentId: number) => string;
  tournaments_path: () => string;
  registration_notice_beta_tournament_path: (tournamentId: number) => string;
  qr_beta_tournament_path: (tournamentId: number) => string;
};

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

interface TournamentJsonApi {
  data: {
    id: string;
    type: string;
    attributes: Tournament;
    relationships: {
      tournament_type: {
        links: {
          related: string | null;
        };
      };
      user: {
        links: {
          related: string | null;
        };
      };
    };
    links: {
      self: string;
    };
  };
  meta: object;
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

export function deckVisibilityString(
  visibility: SwissDeckVisibility | CutDeckVisibility,
) {
  if (
    visibility === SwissDeckVisibility.Open ||
    visibility === CutDeckVisibility.Open
  ) {
    return "open";
  } else if (
    visibility === SwissDeckVisibility.Public ||
    visibility === CutDeckVisibility.Public
  ) {
    return "public";
  }
  return "private";
}

export interface TournamentOptions {
  tournament_types: { id: number; name: string }[];
  formats: { id: number; name: string }[];
  card_sets: { id: number; name: string }[];
  deckbuilding_restrictions: { id: number; name: string }[];
  time_zones: { id: string; name: string }[];
  official_prize_kits: { id: number; name: string }[];
}

export interface FeatureFlags {
  allow_self_reporting?: boolean;
}

export interface TournamentSettingsData {
  tournament: Tournament;
  options: TournamentOptions;
  feature_flags: FeatureFlags;
  csrf_token: string;
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

export async function loadTournament(
  tournamentId: number,
): Promise<Tournament> {
  const response = await fetch(
    Routes.api_v1_public_tournament_path(tournamentId),
    {
      method: "GET",
    },
  );

  const apiTournament = (await response.json()) as TournamentJsonApi;
  const tournament = apiTournament.data.attributes;
  tournament.id = parseInt(apiTournament.data.id);

  return tournament;
}

export async function loadNewTournament(): Promise<TournamentSettingsData> {
  const response = await fetch(Routes.new_form_tournaments_path(), {
    headers: { Accept: "application/json" },
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status.toString()}: ${response.statusText}`,
    );
  }
  return (await response.json()) as TournamentSettingsData;
}

export async function loadEditTournament(
  id: number,
): Promise<TournamentSettingsData> {
  const response = await fetch(Routes.edit_form_tournament_path(id), {
    headers: { Accept: "application/json" },
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status.toString()}: ${response.statusText}`,
    );
  }
  return (await response.json()) as TournamentSettingsData;
}

export interface TournamentCreateResponse {
  id: number;
  name: string;
  url: string;
}

export interface TournamentCreateErrorResponse {
  errors: Errors;
}

export async function createTournament(
  csrfToken: string,
  tournament: Tournament,
): Promise<TournamentCreateResponse> {
  const response = await fetch(Routes.tournaments_path(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ tournament }),
  });

  if (!response.ok) {
    if (response.status === 422) {
      const errorData =
        (await response.json()) as TournamentCreateErrorResponse;
      throw new ValidationError(errorData.errors);
    }
    throw new Error(
      `HTTP ${response.status.toString()}: ${response.statusText}`,
    );
  }

  return (await response.json()) as TournamentCreateResponse;
}

export class ValidationError extends Error {
  constructor(public errors: Errors) {
    super("Validation failed");
    this.name = "ValidationError";
  }
}

export async function loadQRCode(tournamentId: number) {
  const response = await fetch(Routes.qr_beta_tournament_path(tournamentId), {
    method: "GET",
  });

  return await response.blob();
}
