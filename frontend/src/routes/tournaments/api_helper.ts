import { COBRA_API_SERVER } from "$app/env/public";
import type { BracketData } from "$lib/model/Bracket";
import type { Card, Deck } from "$lib/model/Deck";
import type { IdentityNames } from "$lib/model/Identity";
import type { Player } from "$lib/model/Player";
import type { RoundTimer } from "$lib/model/Round";
import type { StandingsData } from "$lib/model/Standings";
import { Tournament, type FeatureFlags, type TournamentOptions } from "$lib/model/Tournament";
import type { TournamentsResponse } from "$lib/utils/api_types";
import { ValidationError, type Errors } from "$lib/utils/errors";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

const apiServer = (COBRA_API_SERVER || "").replace(/\/$/, "");

export interface TournamentData {
  tournament: Tournament,
  csrf_token: string,
}

export interface TournamentSettingsData {
  tournament: Tournament;
  options: TournamentOptions;
  feature_flags: FeatureFlags;
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

export function csrfToken() {
  return typeof document !== "undefined"
    ? (document
        .querySelector("meta[name='csrf-token']")
        ?.getAttribute("content") ?? "")
    : "";
}

export async function loadTournament(tournamentId: number, altFetch = fetch) {
  const response = await altFetch(
    `${apiServer}/beta/tournaments/${tournamentId}`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );

  return (await response.json()) as TournamentData;
}

export async function loadTournaments(url: string, altFetch = fetch): Promise<TournamentsResponse> {
  try {
    const response = await altFetch(url, {
      headers: {
        Accept: "application/vnd.api+json",
        "Content-Type": "application/vnd.api+json",
      },
    });
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    return (await response.json()) as TournamentsResponse;
  } catch (e) {
    const err = e as Error;
    globalMessages.errors.push(`Failed to load tournaments: ${err.message}`);
  }

  return {
    data: [],
  };
}

export function tournamentsApiUrl(tournamentTypeId?: string): string {
  const query = [
    `${apiServer}/api/v1/public/tournaments?page[size]=10`,
    "include=tournament_type",
    "sort=-date,name",
  ];

  if (tournamentTypeId && tournamentTypeId.length > 0) {
    query.push(`filter[tournament_type_id]=${tournamentTypeId}`);
  }

  return query.join("&");
}

export async function loadNewTournament(
  fetch: typeof globalThis.fetch,
): Promise<TournamentSettingsData> {
  const response = await fetch(`${apiServer}/tournaments/new_form`, {
    credentials: "include",
    headers: { Accept: "application/json" },
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status.toString()}: ${response.statusText}`);
  }

  return (await response.json()) as TournamentSettingsData;
}

export async function createTournament(
  csrfToken: string,
  tournament: Tournament,
): Promise<TournamentCreateResponse> {
  const response = await fetch(`${apiServer}/tournaments`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ tournament }),
  });

  if (!response.ok) {
    if (response.status === 422) {
      const errorData = (await response.json()) as TournamentCreateErrorResponse;
      throw new ValidationError(errorData.errors);
    }
    throw new Error(`HTTP ${response.status.toString()}: ${response.statusText}`);
  }

  return (await response.json()) as TournamentCreateResponse;
}

export async function loadPlayerByUserId(tournamentId: number, userId: number, altFetch = fetch) {
  try {
    const response = await altFetch(
      `${apiServer}/beta/tournaments/${tournamentId}/players/by_user_id/${userId}`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    return (await response.json()) as Player;
  } catch {
    globalMessages.errors.push(`Error loading player data for user ${userId}.`);
  }
  
  return null;
}

export async function savePlayer(
  csrfToken: string, tournamentId: number, player: Player, organizerView = false,
) {
  const route =
    player.id === 0
      ? `${apiServer}/beta/tournaments/${tournamentId}/players`
      : `${apiServer}/beta/tournaments/${tournamentId}/player/${player.id}`;
  const response = await fetch(route, {
    method: player.id === 0 ? "POST" : "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({
      player: playerRequestObject(player),
      organiser_view: organizerView,
    }),
  });

  const result = (await response.json()) as {
    player: Player;
    errors?: string[];
  };
  globalMessages.errors = result.errors ?? [];

  return result.player;
}

export async function loadIdentityNames() {
  const response = await fetch(`${apiServer}/beta/identities`, {
    method: "GET",
  });

  return (await response.json()) as IdentityNames;
}

export async function loadCurrentRoundTimer(tournamentId: number, csrfToken?: string) {
  const response = await fetch(`${apiServer}/beta/tournaments/${tournamentId}/current_round_timer`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken ?? "",
    },
  });

  return (await response.json()) as RoundTimer;
}

function playerRequestObject(player: Player) {
  return {
    name: player.name,
    pronouns: player.pronouns,
    corp_identity: player.corp_id.name,
    runner_identity: player.runner_id.name,
    include_in_stream: player.include_in_stream,
    first_round_bye: player.first_round_bye,
    manual_seed: player.manual_seed,
    fixed_table_number: player.fixed_table_number,
    corp_deck: player.corp_deck
      ? deckRequestObject(player.corp_deck)
      : undefined,
    runner_deck: player.runner_deck
      ? deckRequestObject(player.runner_deck)
      : undefined,
  };
}

function deckRequestObject(deck: Deck) {
  const {
    id,
    user_id,
    player_id,
    player_name,
    created_at,
    updated_at,
    ...details
  } = deck.details;

  return {
    details: details,
    cards: deck.cards.map((c) => cardRequestObject(c)),
  };
}

function cardRequestObject(card: Card) {
  const { id, deck_id, created_at, updated_at, ...newCard } = card;

  return newCard;
}

export async function loadStandings(tournamentId: number, altFetch = fetch): Promise<StandingsData> {
  const response = await altFetch(
    `${apiServer}/tournaments/${tournamentId}/players/standings_data`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to load standings: ${response.statusText}`);
  }
  return (await response.json()) as StandingsData;
}


export async function loadBrackets(tournamentId: number, altFetch = fetch): Promise<BracketData> {
  const response = await altFetch(
    `${apiServer}/tournaments/${tournamentId}/rounds/brackets`,
    {
      method: "GET",
    },
  );

  return (await response.json()) as BracketData;
}
