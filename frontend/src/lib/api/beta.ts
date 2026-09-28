import { api } from "$lib/api/apiBase";
import type { PairingsData, RoundData, TournamentData } from "$lib/api/betaTypes";
import type { Deck, NrdbDeck } from "$lib/model/Deck";
import type { IdentityNames } from "$lib/model/Identity";
import type { NewPairing } from "$lib/model/Pairing";
import { Player, playerRequestObject, type PlayersData } from "$lib/model/Player";
import type { RoundTimer } from "$lib/model/Round";
import type { ScoreReport } from "$lib/model/ScoreReport";
import type { Stats, CutStats } from "$lib/model/Stats";
import type { Tournament } from "$lib/model/Tournament";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

export const loadTournament = (tournamentId: number, altFetch = fetch): Promise<TournamentData> =>
  api.getOrThrow<TournamentData>(`/beta/tournaments/${tournamentId}`, altFetch);

export const loadPlayer = (
  tournamentId: number,
  playerId: number,
  altFetch = fetch,
): Promise<Player> =>
  api.getOrThrow<Player>(`/beta/tournaments/${tournamentId}/players/${playerId}`, altFetch);

export const loadPlayerByUserId = (
  tournamentId: number,
  userId: number,
  altFetch = fetch,
): Promise<Player> =>
  api.getOrThrow<Player>(
    `/beta/tournaments/${tournamentId}/players/by_user_id/${userId}`,
    altFetch,
  );

interface SavePlayerResponse {
  player: Player;
  errors?: string[];
}

export async function savePlayer(
  tournamentId: number,
  player: Player,
  organizerView = false,
  altFetch = fetch,
): Promise<Player> {
  const isCreate = player.id === 0;
  const path = isCreate
    ? `/beta/tournaments/${tournamentId}/players`
    : `/beta/tournaments/${tournamentId}/players/${player.id}`;
  const body = {
    player: playerRequestObject(player),
    organiser_view: organizerView,
  };

  const res = isCreate
    ? await api.post<SavePlayerResponse>(path, body, { altFetch })
    : await api.patch<SavePlayerResponse>(path, body, { altFetch });

  if (!res.ok) {
    globalMessages.errors = [res.error.message];
    return player;
  }

  globalMessages.errors = res.data.errors ?? [];
  return res.data.player;
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
  const data = await api.getOrThrow<PairingsData>(
    `/beta/tournaments/${tournamentId}/rounds/pairings_data`,
    altFetch,
  );
  globalMessages.warnings = data.warnings ?? [];
  return data;
}

export const loadStats = (tournamentId: number, altFetch = fetch): Promise<Stats> =>
  api.getOrThrow<Stats>(`/beta/tournaments/${tournamentId}/id_and_faction_data`, altFetch);

export const loadCutStats = (tournamentId: number, altFetch = fetch): Promise<CutStats> =>
  api.getOrThrow<CutStats>(`/beta/tournaments/${tournamentId}/cut_conversion_rates`, altFetch);

export const loadCurrentRoundTimer = (
  tournamentId: number,
  altFetch = fetch,
): Promise<RoundTimer> =>
  api.getOrThrow<RoundTimer>(`/beta/tournaments/${tournamentId}/current_round_timer`, altFetch, "");

export const loadIdentityNames = (altFetch = fetch): Promise<IdentityNames> =>
  api.getOrThrow<IdentityNames>("/beta/identities", altFetch);

export const loadPlayers = (tournamentId: number, altFetch = fetch): Promise<PlayersData> =>
  api.getOrThrow<PlayersData>(`/beta/tournaments/${tournamentId}/players/players_data`, altFetch);

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
  return api.getOrThrow<Deck[]>(path, altFetch);
}

export const loadNrdbDecks = (
  tournamentId: number,
  playerId: number,
  altFetch = fetch,
): Promise<NrdbDeck[]> =>
  api.getOrThrow<NrdbDeck[]>(
    `/beta/tournaments/${tournamentId}/players/${playerId}/nrdb_decks`,
    altFetch,
  );

export async function saveTournament(tournament: Tournament): Promise<boolean> {
  const res = await api.patch(`/beta/tournaments/${tournament.id}`, tournament);
  if (!res.ok) {
    globalMessages.errors = [res.error.message];
    return false;
  }
  return true;
}

export const changePlayerSide = (
  tournamentId: number,
  roundId: number,
  pairingId: number,
  side: string,
  altFetch = fetch,
): Promise<boolean> =>
  api.postAction(
    `/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}/report`,
    { side: `player1_is_${side}` },
    { altFetch },
  );

export async function reportScore(
  tournamentId: number,
  roundId: number,
  pairingId: number,
  data: ScoreReport,
  selfReport: boolean,
  altFetch = fetch,
): Promise<boolean> {
  // Remove UI-specific data to prevent parameter errors on the server
  const cleanData = { ...data };
  delete cleanData.label;
  delete cleanData.extra_self_report_label;

  const res = await api.post(
    `/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}/report`,
    {
      pairing: cleanData,
      self_report: selfReport,
    },
    { altFetch },
  );

  if (!res.ok) {
    globalMessages.errors.push("Failed to report score.");
    return false;
  }

  return true;
}

export const completeRound = (
  tournamentId: number,
  roundId: number,
  completed: boolean,
): Promise<boolean> =>
  api.patchAction(`/beta/tournaments/${tournamentId}/rounds/${roundId}/complete`, { completed });

export const updateRoundTimer = (
  tournamentId: number,
  roundId: number,
  length_minutes: number,
  operation: string,
): Promise<boolean> =>
  api.patchAction(`/beta/tournaments/${tournamentId}/rounds/${roundId}/update_timer`, {
    length_minutes,
    operation,
  });

export const resetReports = (
  tournamentId: number,
  roundId: number,
  pairingId: number,
  altFetch = fetch,
): Promise<boolean> =>
  api.deleteAction(
    `/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}/reset_self_report`,
    undefined,
    { altFetch },
  );

export function createStage(
  tournamentId: number,
  cutSingleElim?: boolean,
  cutCount?: number,
): Promise<boolean> {
  const isCut = cutSingleElim !== undefined && cutCount !== undefined;
  const path = isCut
    ? `/beta/tournaments/${tournamentId}/cut`
    : `/beta/tournaments/${tournamentId}/stages`;
  const body = isCut
    ? { number: cutCount, ...(cutSingleElim ? { elimination_type: "single" } : {}) }
    : null;

  return api.postAction(path, body);
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
  altFetch = fetch,
): Promise<boolean> {
  const res = await api.delete(path, { confirmation_name: confirmationName }, { altFetch });

  if (!res.ok) {
    if (res.status === 422) {
      globalMessages.errors.push(res.error.message);
    } else if (res.status === 0) {
      globalMessages.errors.push(`Failed to delete ${entityName}: ${res.error.message}`);
    } else {
      globalMessages.errors.push(`Failed to delete ${entityName}.`);
    }
    return false;
  }

  return true;
}

export const deleteTournament = (
  tournamentId: number,
  confirmationName: string,
  altFetch = fetch,
): Promise<boolean> =>
  deleteWithConfirmation(
    `/beta/tournaments/${tournamentId}`,
    confirmationName,
    "tournament",
    altFetch,
  );

export const deleteStage = (
  tournamentId: number,
  stageId: number,
  confirmationName: string,
  altFetch = fetch,
): Promise<boolean> =>
  deleteWithConfirmation(
    `/beta/tournaments/${tournamentId}/stages/${stageId}`,
    confirmationName,
    "stage",
    altFetch,
  );

export async function loadRound(
  tournamentId: number,
  roundId: number,
  altFetch = fetch,
): Promise<RoundData> {
  const data = await api.getOrThrow<RoundData>(
    `/beta/tournaments/${tournamentId}/rounds/${roundId}/round_data`,
    altFetch,
  );
  globalMessages.warnings = data.warnings ?? [];
  return data;
}

export const pairRound = (tournamentId: number): Promise<boolean> =>
  api.postAction(`/beta/tournaments/${tournamentId}/rounds`);

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
