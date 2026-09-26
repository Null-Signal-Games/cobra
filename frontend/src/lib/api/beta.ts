import { COBRA_API_SERVER } from "$app/env/public";
import type { PairingsData, RoundData, TournamentData } from "./betaTypes";
import type { Card, Deck, NrdbDeck } from "$lib/model/Deck";
import type { IdentityNames } from "$lib/model/Identity";
import type { NewPairing } from "$lib/model/Pairing";
import type { Player, PlayersData } from "$lib/model/Player";
import type { RoundTimer } from "$lib/model/Round";
import type { ScoreReport } from "$lib/model/ScoreReport";
import type { Stats, CutStats } from "$lib/model/Stats";
import { Tournament } from "$lib/model/Tournament";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

const apiServer = (COBRA_API_SERVER || "").replace(/\/$/, "");

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

function resolveCsrfAndFetch(
  csrfOrFetch?: string | typeof fetch,
  altFetch: typeof fetch = fetch,
): { token: string; customFetch: typeof fetch } {
  let token = "";
  let customFetch = altFetch;

  if (typeof csrfOrFetch === "function") {
    customFetch = csrfOrFetch;
  } else if (typeof csrfOrFetch === "string") {
    token = csrfOrFetch;
  }

  if (!token) {
    token = csrfToken();
  }

  return { token, customFetch };
}

export async function changePlayerSide(
  tournamentId: number,
  roundId: number,
  pairingId: number,
  side: string,
  csrfOrFetch?: string | typeof fetch,
  altFetch = fetch,
): Promise<boolean> {
  const { token, customFetch } = resolveCsrfAndFetch(csrfOrFetch, altFetch);

  try {
    const response = await customFetch(
      `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}/report`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-Token": token,
        },
        body: JSON.stringify({ side: `player1_is_${side}` }),
      },
    );

    if (!response.ok) {
      globalMessages.errors.push("Failed to change player side.");
      return false;
    }

    return true;
  } catch (e) {
    const err = e as Error;
    globalMessages.errors.push(`Failed to change player side: ${err.message}`);
    return false;
  }
}

export async function reportScore(
  tournamentId: number,
  roundId: number,
  pairingId: number,
  data: ScoreReport,
  selfReport: boolean,
  csrfOrFetch?: string | typeof fetch,
  altFetch = fetch,
): Promise<boolean> {
  // Remove UI-specific data to prevent parameter errors on the server
  const cleanData = { ...data };
  delete cleanData.label;
  delete cleanData.extra_self_report_label;

  const { token, customFetch } = resolveCsrfAndFetch(csrfOrFetch, altFetch);

  try {
    const response = await customFetch(
      `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}/report`,
      {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-Token": token,
        },
        body: JSON.stringify({
          pairing: cleanData,
          self_report: selfReport,
        }),
      },
    );

    if (!response.ok) {
      globalMessages.errors.push("Failed to report score.");
      return false;
    }

    return true;
  } catch (e) {
    const err = e as Error;
    globalMessages.errors.push(`Failed to report score: ${err.message}`);
    return false;
  }
}


export async function completeRound(
  tournamentId: number,
  roundId: number,
  completed: boolean,
): Promise<boolean> {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/complete`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
      body: JSON.stringify({ completed: completed }),
    },
  );

  return response.status === 200;
}

export async function updateRoundTimer(
  csrfToken: string,
  tournamentId: number,
  roundId: number,
  length_minutes: number,
  operation: string,
): Promise<boolean> {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/update_timer`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({
        length_minutes: length_minutes,
        operation: operation,
      }),
    },
  );

  return response.status === 200;
}

export async function resetReports(
  tournamentId: number,
  roundId: number,
  pairingId: number,
  csrfOrFetch?: string | typeof fetch,
  altFetch = fetch,
): Promise<boolean> {
  const { token, customFetch } = resolveCsrfAndFetch(csrfOrFetch, altFetch);

  try {
    const response = await customFetch(
      `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}/reset_self_report`,
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-Token": token,
        },
      },
    );

    if (!response.ok) {
      globalMessages.errors.push("Failed to reset self report.");
      return false;
    }

    return true;
  } catch (e) {
    const err = e as Error;
    globalMessages.errors.push(`Failed to reset self report: ${err.message}`);
    return false;
  }
}

export async function createStage(
  csrfToken: string,
  tournamentId: number,
  cutSingleElim?: boolean,
  cutCount?: number,
) {
  const isCut = cutSingleElim !== undefined && cutCount !== undefined;
  const path = isCut
    ? `${apiServer}/beta/tournaments/${tournamentId}/cut`
    : `${apiServer}/beta/tournaments/${tournamentId}/stages`;
  const body = isCut
    ? { number: cutCount, ...(cutSingleElim && { elimination_type: "single" }) }
    : null;

  const response = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify(body),
  });

  return response.status === 200;
}

export async function createPairing(
  tournamentId: number,
  roundId: number,
  newPairing: NewPairing,
): Promise<boolean> {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
      body: JSON.stringify({ pairing: newPairing }),
    },
  );

  return response.status === 200;
}

export async function deletePairing(
  tournamentId: number,
  roundId: number,
  pairingId: number,
): Promise<boolean> {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
    },
  );

  return response.status === 200;
}

export async function deleteTournament(
  tournamentId: number,
  confirmationName: string,
  csrfOrFetch?: string | typeof fetch,
  altFetch = fetch,
): Promise<boolean> {
  const { token, customFetch } = resolveCsrfAndFetch(csrfOrFetch, altFetch);

  try {
    const response = await customFetch(`${apiServer}/beta/tournaments/${tournamentId}`, {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": token,
      },
      body: JSON.stringify({ confirmation_name: confirmationName }),
    });

    if (!response.ok) {
      if (response.status === 422) {
        try {
          const errData = (await response.json()) as { error?: string };
          if (errData.error) {
            globalMessages.errors.push(errData.error);
            return false;
          }
        } catch {
          // ignore json parse error
        }
      }
      globalMessages.errors.push("Failed to delete tournament.");
      return false;
    }

    return true;
  } catch (e) {
    const err = e as Error;
    globalMessages.errors.push(`Failed to delete tournament: ${err.message}`);
    return false;
  }
}

export async function deleteStage(
  tournamentId: number,
  stageId: number,
  confirmationName: string,
  csrfOrFetch?: string | typeof fetch,
  altFetch = fetch,
): Promise<boolean> {
  const { token, customFetch } = resolveCsrfAndFetch(csrfOrFetch, altFetch);

  try {
    const response = await customFetch(
      `${apiServer}/beta/tournaments/${tournamentId}/stages/${stageId}`,
      {
        method: "DELETE",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "X-CSRF-Token": token,
        },
        body: JSON.stringify({ confirmation_name: confirmationName }),
      },
    );

    if (!response.ok) {
      if (response.status === 422) {
        try {
          const errData = (await response.json()) as { error?: string };
          if (errData.error) {
            globalMessages.errors.push(errData.error);
            return false;
          }
        } catch {
          // ignore json parse error
        }
      }
      globalMessages.errors.push("Failed to delete stage.");
      return false;
    }

    return true;
  } catch (e) {
    const err = e as Error;
    globalMessages.errors.push(`Failed to delete stage: ${err.message}`);
    return false;
  }
}

export async function loadRound(
  tournamentId: number,
  roundId: number,
  altFetch = fetch,
): Promise<RoundData> {
  const response = await altFetch(
    `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/round_data`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  const data = (await response.json()) as RoundData;
  globalMessages.warnings = data.warnings ?? [];

  return data;
}

export async function pairRound(csrfToken: string, tournamentId: number) {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/rounds`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken
      },
    },
  );

  return response.status === 200;
}

export async function rePairRound(
  tournamentId: number,
  roundId: number,
): Promise<boolean> {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}/repair`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
    },
  );

  return response.status === 200;
}

export async function deleteRound(
  tournamentId: number,
  roundId: number,
): Promise<boolean> {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}`,
    {
      method: "DELETE",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
    },
  );

  return response.status === 200;
}

export async function saveSOSWeighting(
  tournamentId: number,
  roundId: number,
  weight: number,
): Promise<boolean> {
  const response = await fetch(
    `${apiServer}/beta/tournaments/${tournamentId}/rounds/${roundId}`,
    {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
      body: JSON.stringify({ weight: weight }),
    },
  );

  return response.status === 200;
}
