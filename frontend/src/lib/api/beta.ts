import { api } from "$lib/api/apiBase";
import { csrfToken } from "$lib/csrf";
import type { PairingsData, RoundData, TournamentData } from "$lib/api/betaTypes";
import type { Card, Deck, NrdbDeck } from "$lib/model/Deck";
import type { IdentityNames } from "$lib/model/Identity";
import type { NewPairing } from "$lib/model/Pairing";
import { Player, type PlayersData } from "$lib/model/Player";
import type { RoundTimer } from "$lib/model/Round";
import type { ScoreReport } from "$lib/model/ScoreReport";
import type { Stats, CutStats } from "$lib/model/Stats";
import type { Tournament } from "$lib/model/Tournament";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

async function getOrThrow<T>(
  path: string,
  altFetch = fetch,
  prefix = "",
  token?: string,
): Promise<T> {
  const res = await api.get<T>(path, { altFetch, csrfToken: token });
  if (!res.ok) {
    throw new Error(prefix ? `${prefix}: ${res.error.message}` : res.error.message);
  }
  return res.data;
}

export const loadTournament = (tournamentId: number, altFetch = fetch): Promise<TournamentData> =>
  getOrThrow<TournamentData>(`/beta/tournaments/${tournamentId}`, altFetch);

export async function loadPlayer(
  tournamentId: number,
  playerId: number,
  altFetch = fetch,
): Promise<Player | null> {
  try {
    const res = await api.get<Player>(`/beta/tournaments/${tournamentId}/players/${playerId}`, {
      altFetch,
    });
    if (!res.ok) {
      throw res.error;
    }
    const player = new Player();
    Object.assign(player, res.data);
    return player;
  } catch {
    globalMessages.errors.push(`Error loading player data for player ${playerId}.`);
    return null;
  }
}

export async function loadPlayerByUserId(
  tournamentId: number,
  userId: number,
  altFetch = fetch,
): Promise<Player | null> {
  try {
    return await getOrThrow<Player>(
      `/beta/tournaments/${tournamentId}/players/by_user_id/${userId}`,
      altFetch,
    );
  } catch {
    globalMessages.errors.push(`Error loading player data for user ${userId}.`);
    return null;
  }
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
    corp_deck: player.corp_deck ? deckRequestObject(player.corp_deck) : undefined,
    runner_deck: player.runner_deck ? deckRequestObject(player.runner_deck) : undefined,
  };
}

// TODO(plural): Find a new home for this.
function deckRequestObject(deck: Deck) {
  const { id, user_id, player_id, player_name, created_at, updated_at, ...details } = deck.details;

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
  let organizerView: boolean;

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

  const path =
    player.id === 0
      ? `/beta/tournaments/${tournamentId}/players`
      : `/beta/tournaments/${tournamentId}/players/${player.id}`;
  const response = await api.rawRequest(path, player.id === 0 ? "POST" : "PATCH", {
    csrfToken: token || undefined,
    body: {
      player: playerRequestObject(player),
      organiser_view: organizerView,
    },
  });

  const result = (await response.json()) as {
    player: Player;
    errors?: string[];
  };
  globalMessages.errors = result.errors ?? [];

  return result.player;
}

export const reinstatePlayer = (tournamentId: number, player: Player): Promise<boolean> =>
  api.patchAction(`/beta/tournaments/${tournamentId}/players/${player.id}/reinstate`, {
    player: playerRequestObject(player),
  });

export const deletePlayer = (tournamentId: number, player: Player): Promise<boolean> =>
  api.deleteAction(`/beta/tournaments/${tournamentId}/players/${player.id}`, {
    player: playerRequestObject(player),
  });

export function togglePlayerLock(tournamentId: number, player: Player): Promise<boolean> {
  const action = player.registration_locked ? "unlock_registration" : "lock_registration";
  return api.patchAction(`/beta/tournaments/${tournamentId}/players/${player.id}/${action}`, {
    player: playerRequestObject(player),
  });
}

export const dropPlayer = (tournamentId: number, player: Player): Promise<boolean> =>
  api.patchAction(`/beta/tournaments/${tournamentId}/players/${player.id}/drop`, {
    player: playerRequestObject(player),
  });

export async function loadPairings(tournamentId: number, altFetch = fetch): Promise<PairingsData> {
  const data = await getOrThrow<PairingsData>(
    `/beta/tournaments/${tournamentId}/rounds/pairings_data`,
    altFetch,
  );
  globalMessages.warnings = data.warnings ?? [];
  return data;
}

export const loadStats = (tournamentId: number, altFetch = fetch): Promise<Stats> =>
  getOrThrow<Stats>(`/beta/tournaments/${tournamentId}/id_and_faction_data`, altFetch);

export const loadCutStats = (tournamentId: number, altFetch = fetch): Promise<CutStats> =>
  getOrThrow<CutStats>(`/beta/tournaments/${tournamentId}/cut_conversion_rates`, altFetch);

export const loadCurrentRoundTimer = (
  tournamentId: number,
  csrfToken?: string,
  altFetch = fetch,
): Promise<RoundTimer> =>
  getOrThrow<RoundTimer>(
    `/beta/tournaments/${tournamentId}/current_round_timer`,
    altFetch,
    "",
    csrfToken,
  );

export const loadIdentityNames = (altFetch = fetch): Promise<IdentityNames> =>
  getOrThrow<IdentityNames>("/beta/identities", altFetch);

export const loadPlayers = (tournamentId: number, altFetch = fetch): Promise<PlayersData> =>
  getOrThrow<PlayersData>(`/beta/tournaments/${tournamentId}/players/players_data`, altFetch);

export function setPlayerRegistrationStatus(
  tournamentId: number,
  locked: boolean,
): Promise<boolean> {
  const action = locked ? "lock_player_registrations" : "unlock_player_registrations";
  return api.patchAction(`/beta/tournaments/${tournamentId}/${action}`);
}

export function setRegistrationStatus(tournamentId: number, open: boolean): Promise<boolean> {
  const action = open ? "open_registration" : "close_registration";
  return api.patchAction(`/beta/tournaments/${tournamentId}/${action}`);
}

export function loadDecks(
  tournamentId: number,
  playerId?: number,
  altFetch = fetch,
): Promise<Deck[]> {
  const path =
    playerId === undefined
      ? `/beta/tournaments/${tournamentId}/players/decks`
      : `/beta/tournaments/${tournamentId}/players/${playerId}/decks`;
  return getOrThrow<Deck[]>(path, altFetch);
}

export const loadNrdbDecks = (
  tournamentId: number,
  playerId: number,
  altFetch = fetch,
): Promise<NrdbDeck[]> =>
  getOrThrow<NrdbDeck[]>(
    `/beta/tournaments/${tournamentId}/players/${playerId}/nrdb_decks`,
    altFetch,
  );

export async function saveTournament(tournament: Tournament): Promise<boolean> {
  const response = await api.rawRequest(`/beta/tournaments/${tournament.id}`, "PATCH", {
    body: tournament,
  });

  if (response.status !== 200) {
    try {
      const data = (await response.json()) as { errors?: string[] };
      globalMessages.errors = data.errors ?? [];
    } catch {
      // ignore json parse error
    }
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
    const response = await api.rawRequest(
      `/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}/report`,
      "POST",
      {
        altFetch: customFetch,
        csrfToken: token,
        body: { side: `player1_is_${side}` },
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
    const response = await api.rawRequest(
      `/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}/report`,
      "POST",
      {
        altFetch: customFetch,
        csrfToken: token,
        body: {
          pairing: cleanData,
          self_report: selfReport,
        },
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

export const completeRound = (
  tournamentId: number,
  roundId: number,
  completed: boolean,
): Promise<boolean> =>
  api.patchAction(`/beta/tournaments/${tournamentId}/rounds/${roundId}/complete`, { completed });

export async function updateRoundTimer(
  csrfToken: string,
  tournamentId: number,
  roundId: number,
  length_minutes: number,
  operation: string,
): Promise<boolean> {
  return api.patchAction(
    `/beta/tournaments/${tournamentId}/rounds/${roundId}/update_timer`,
    {
      length_minutes,
      operation,
    },
    { csrfToken: csrfToken || undefined },
  );
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
    const response = await api.rawRequest(
      `/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}/reset_self_report`,
      "DELETE",
      {
        altFetch: customFetch,
        csrfToken: token,
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
): Promise<boolean> {
  const isCut = cutSingleElim !== undefined && cutCount !== undefined;
  const path = isCut
    ? `/beta/tournaments/${tournamentId}/cut`
    : `/beta/tournaments/${tournamentId}/stages`;
  const body = isCut
    ? { number: cutCount, ...(cutSingleElim && { elimination_type: "single" }) }
    : null;

  return api.postAction(path, body, { csrfToken: csrfToken || undefined });
}

export const createPairing = (
  tournamentId: number,
  roundId: number,
  newPairing: NewPairing,
): Promise<boolean> =>
  api.postAction(`/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings`, {
    pairing: newPairing,
  });

export const deletePairing = (
  tournamentId: number,
  roundId: number,
  pairingId: number,
): Promise<boolean> =>
  api.deleteAction(`/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}`);

async function deleteWithConfirmation(
  path: string,
  confirmationName: string,
  entityName: string,
  csrfOrFetch?: string | typeof fetch,
  altFetch = fetch,
): Promise<boolean> {
  const { token, customFetch } = resolveCsrfAndFetch(csrfOrFetch, altFetch);

  try {
    const response = await api.rawRequest(path, "DELETE", {
      altFetch: customFetch,
      csrfToken: token,
      body: { confirmation_name: confirmationName },
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
      globalMessages.errors.push(`Failed to delete ${entityName}.`);
      return false;
    }

    return true;
  } catch (e) {
    const err = e as Error;
    globalMessages.errors.push(`Failed to delete ${entityName}: ${err.message}`);
    return false;
  }
}

export const deleteTournament = (
  tournamentId: number,
  confirmationName: string,
  csrfOrFetch?: string | typeof fetch,
  altFetch = fetch,
): Promise<boolean> =>
  deleteWithConfirmation(
    `/beta/tournaments/${tournamentId}`,
    confirmationName,
    "tournament",
    csrfOrFetch,
    altFetch,
  );

export const deleteStage = (
  tournamentId: number,
  stageId: number,
  confirmationName: string,
  csrfOrFetch?: string | typeof fetch,
  altFetch = fetch,
): Promise<boolean> =>
  deleteWithConfirmation(
    `/beta/tournaments/${tournamentId}/stages/${stageId}`,
    confirmationName,
    "stage",
    csrfOrFetch,
    altFetch,
  );

export async function loadRound(
  tournamentId: number,
  roundId: number,
  altFetch = fetch,
): Promise<RoundData> {
  const data = await getOrThrow<RoundData>(
    `/beta/tournaments/${tournamentId}/rounds/${roundId}/round_data`,
    altFetch,
  );
  globalMessages.warnings = data.warnings ?? [];
  return data;
}

export const pairRound = (csrfToken: string, tournamentId: number): Promise<boolean> =>
  api.postAction(`/beta/tournaments/${tournamentId}/rounds`, undefined, {
    csrfToken: csrfToken || undefined,
  });

export const rePairRound = (tournamentId: number, roundId: number): Promise<boolean> =>
  api.patchAction(`/beta/tournaments/${tournamentId}/rounds/${roundId}/repair`);

export const deleteRound = (tournamentId: number, roundId: number): Promise<boolean> =>
  api.deleteAction(`/beta/tournaments/${tournamentId}/rounds/${roundId}`);

export const saveSOSWeighting = (
  tournamentId: number,
  roundId: number,
  weight: number,
): Promise<boolean> =>
  api.patchAction(`/beta/tournaments/${tournamentId}/rounds/${roundId}`, { weight });
