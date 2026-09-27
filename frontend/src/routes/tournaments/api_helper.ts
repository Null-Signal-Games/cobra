import { COBRA_API_SERVER } from "$app/env/public";
import type { Deck, NrdbDeck } from "$lib/model/Deck";
import type { IdentityNames } from "$lib/model/Identity";
import { Player, type PlayersData } from "$lib/model/Player";
import type { RoundTimer } from "$lib/model/Round";
import { Tournament } from "$lib/model/Tournament";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

const apiServer = (COBRA_API_SERVER || "").replace(/\/$/, "");

export function csrfToken() {
  return typeof document !== "undefined"
    ? (document
        .querySelector("meta[name='csrf-token']")
        ?.getAttribute("content") ?? "")
    : "";
}

export async function setPlayerRegistrationStatus(
  tournamentId: number,
  locked: boolean,
): Promise<boolean> {
  const path = locked
    ? `${apiServer}/beta/tournaments/${tournamentId}/lock_player_registrations`
    : `${apiServer}/beta/tournaments/${tournamentId}/unlock_player_registrations`;

  const response = await fetch(path, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken(),
    },
  });

  return response.status === 200;
}

export async function setRegistrationStatus(
  tournamentId: number,
  open: boolean,
): Promise<boolean> {
  const path = open
    ? `${apiServer}/beta/tournaments/${tournamentId}/open_registration`
    : `${apiServer}/beta/tournaments/${tournamentId}/close_registration`;

  const response = await fetch(path, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken(),
    },
  });

  return response.status === 200;
}

export async function loadDecks(tournamentId: number, playerId?: number, altFetch = fetch) {
  const response = await altFetch(
    playerId === undefined
      ? `${apiServer}/beta/tournaments/${tournamentId}/players/decks`
      : `${apiServer}/beta/tournaments/${tournamentId}/players/${playerId}/decks`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    },
  );

  return (await response.json()) as Deck[];
}

export async function loadNrdbDecks(tournamentId: number, playerId: number, altFetch = fetch) {
  const response = await altFetch(
    `${apiServer}/beta/tournaments/${tournamentId}/players/${playerId}/nrdb_decks`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    },
  );
  if (response.status == 422) {
    throw new Error();
  }

  return (await response.json()) as NrdbDeck[];
}

export async function saveTournament(tournament: Tournament): Promise<boolean> {
  const response = await fetch(`${apiServer}/beta/tournaments/${tournament.id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken(),
    },
    body: JSON.stringify(tournament),
  });

  if (response.status !== 200) {
    const data = (await response.json()) as { errors?: string[] };
    globalMessages.errors = data.errors ?? [];
  }

  return response.status === 200;
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
