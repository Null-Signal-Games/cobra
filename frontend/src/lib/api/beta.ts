import { COBRA_API_SERVER } from "$app/env/public";
import type { Card, Deck } from "$lib/model/Deck";
import type { IdentityNames } from "$lib/model/Identity";
import type { Player, PlayersData } from "$lib/model/Player";
import type { RoundTimer } from "$lib/model/Round";
import type { Stage } from "$lib/model/Stage";
import type { CutStats, Stats } from "$lib/model/Stats";
import { TournamentPolicies } from "$lib/model/Tournament";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";
import type { TournamentData } from "./betaTypes";
const apiServer = (COBRA_API_SERVER || "").replace(/\/$/, "");

export class PairingsData {
  policy = new TournamentPolicies();
  stages: Stage[] = [];
  warnings?: string[] = [];
}

// TODO(plural): move this to its own library
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

// TODO(plural): Find a new home for this.
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

// TODO(plural): Find a new home for this.
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

// TODO(plural): Find a new home for this.
function cardRequestObject(card: Card) {
  const { id, deck_id, created_at, updated_at, ...newCard } = card;

  return newCard;
}

export async function savePlayer(
  csrfToken: string,
  tournamentId: number,
  player: Player,
  organizerView?: boolean,
): Promise<Player>;
export async function savePlayer(
  tournamentId: number,
  player: Player,
  organizerView?: boolean,
): Promise<Player>;
export async function savePlayer(
  arg1: string | number,
  arg2: number | Player,
  arg3?: Player | boolean,
  arg4 = false,
): Promise<Player> {
  let token = "";
  let tournamentId: number;
  let player: Player;
  let organizerView : boolean;

  if (typeof arg1 === "string") {
    token = arg1;
    tournamentId = arg2 as number;
    player = arg3 as Player;
    organizerView = arg4;
  } else {
    tournamentId = arg1;
    player = arg2 as Player;
    organizerView = typeof arg3 === "boolean" ? arg3 : false;
  }

  const route =
    player.id === 0
      ? `${apiServer}/beta/tournaments/${tournamentId}/players`
      : `${apiServer}/beta/tournaments/${tournamentId}/players/${player.id}`;
  const response = await fetch(route, {
    method: player.id === 0 ? "POST" : "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": token || csrfToken(),
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

export async function reinstatePlayer(tournamentId: number, player: Player) {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/players/${player.id}/reinstate`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
      body: JSON.stringify({ player: playerRequestObject(player) }),
    },
  );

  return response.status === 200;
}

export async function deletePlayer(tournamentId: number, player: Player) {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/players/${player.id}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
      body: JSON.stringify({ player: playerRequestObject(player) }),
    },
  );

  return response.status === 200;
}

export async function togglePlayerLock(tournamentId: number, player: Player) {
  const route = player.registration_locked
    ? `${apiServer}/beta/tournaments/${tournamentId}/players/${player.id}/unlock_registration`
    : `${apiServer}/beta/tournaments/${tournamentId}/players/${player.id}/lock_registration`;
  const response = await fetch(route, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken(),
    },
    body: JSON.stringify({ player: playerRequestObject(player) }),
  });

  return response.status === 200;
}

export async function dropPlayer(tournamentId: number, player: Player) {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/players/${player.id}/drop`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
      body: JSON.stringify({ player: playerRequestObject(player) }),
    },
  );

  return response.status === 200;
}

export async function loadPairings(
  tournamentId: number,
  altFetch = fetch,
) {
  const url = `${apiServer}/beta/tournaments/${tournamentId}/rounds/pairings_data`;

  const response = await altFetch(url, {
    method: "GET",
    credentials: "include",
  });

  const data = (await response.json()) as PairingsData;
  globalMessages.warnings = data.warnings ?? [];

  return data;
}

export async function loadStats(tournamentId: number, altFetch = fetch): Promise<Stats> {
  const response = await altFetch(
    `${apiServer}/beta/tournaments/${tournamentId}/id_and_faction_data`,
    {
      method: "GET",
    },
  );

  return (await response.json()) as Stats;
}

export async function loadCutStats(tournamentId: number, altFetch = fetch): Promise<CutStats> {
  const response = await altFetch(
    `${apiServer}/beta/tournaments/${tournamentId}/cut_conversion_rates`,
    {
      method: "GET",
    },
  );

  return (await response.json()) as CutStats;
}

export async function loadCurrentRoundTimer(tournamentId: number, csrfToken?: string, altFetch = fetch) {
  const response = await altFetch(`${apiServer}/beta/tournaments/${tournamentId}/current_round_timer`, {
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

export async function loadIdentityNames(altFetch = fetch) {
  const response = await altFetch(`${apiServer}/beta/identities`, {
    method: "GET",
  });

  return (await response.json()) as IdentityNames;
}

export async function loadPlayers(tournamentId: number, altFetch = fetch) {
  const response = await altFetch(
    `${apiServer}/beta/tournaments/${tournamentId}/players/players_data`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );
  return (await response.json()) as PlayersData;
}
