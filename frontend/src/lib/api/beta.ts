import { api as defaultApi, type ApiBase } from "$lib/api/apiBase";
import type { PairingsData, RoundData, TournamentData } from "$lib/api/betaTypes";
import type { Deck, NrdbDeck } from "$lib/model/Deck";
import type { IdentityNames } from "$lib/model/Identity";
import type { NewPairing } from "$lib/model/Pairing";
import { type Player, playerRequestObject, type PlayersData } from "$lib/model/Player";
import type { RoundTimer } from "$lib/model/Round";
import type { ScoreReport } from "$lib/model/ScoreReport";
import type { Stats, CutStats } from "$lib/model/Stats";
import type { Tournament } from "$lib/model/Tournament";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

interface SavePlayerResponse {
  player: Player;
  errors?: string[];
}

export class BetaApi {
  constructor(private api: ApiBase = defaultApi) {}

  loadTournament(tournamentId: number, altFetch = fetch): Promise<TournamentData> {
    return this.api.getOrThrow<TournamentData>(`/beta/tournaments/${tournamentId}`, altFetch);
  }

  loadPlayer(tournamentId: number, playerId: number, altFetch = fetch): Promise<Player> {
    return this.api.getOrThrow<Player>(`/beta/tournaments/${tournamentId}/players/${playerId}`, altFetch);
  }

  loadPlayerByUserId(tournamentId: number, userId: number, altFetch = fetch): Promise<Player> {
    return this.api.getOrThrow<Player>(
      `/beta/tournaments/${tournamentId}/players/by_user_id/${userId}`,
      altFetch,
    );
  }

  async savePlayer(
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
      ? await this.api.post<SavePlayerResponse>(path, body, { altFetch })
      : await this.api.patch<SavePlayerResponse>(path, body, { altFetch });

    if (!res.ok) {
      globalMessages.errors = [res.error.message];
      return player;
    }

    globalMessages.errors = res.data.errors ?? [];
    return res.data.player;
  }

  reinstatePlayer(tournamentId: number, player: Player): Promise<boolean> {
    return this.api.patchAction(`/beta/tournaments/${tournamentId}/players/${player.id}/reinstate`, {
      player: playerRequestObject(player),
    });
  }

  deletePlayer(tournamentId: number, player: Player): Promise<boolean> {
    return this.api.deleteAction(`/beta/tournaments/${tournamentId}/players/${player.id}`, {
      player: playerRequestObject(player),
    });
  }

  togglePlayerLock(tournamentId: number, player: Player): Promise<boolean> {
    const action = player.registration_locked ? "unlock_registration" : "lock_registration";
    return this.api.patchAction(`/beta/tournaments/${tournamentId}/players/${player.id}/${action}`, {
      player: playerRequestObject(player),
    });
  }

  dropPlayer(tournamentId: number, player: Player): Promise<boolean> {
    return this.api.patchAction(`/beta/tournaments/${tournamentId}/players/${player.id}/drop`, {
      player: playerRequestObject(player),
    });
  }

  loadPairings(tournamentId: number, altFetch = fetch): Promise<PairingsData> {
    return this.api.getOrThrow<PairingsData>(`/beta/tournaments/${tournamentId}/rounds/pairings_data`, altFetch);
  }

  loadStats(tournamentId: number, altFetch = fetch): Promise<Stats> {
    return this.api.getOrThrow<Stats>(`/beta/tournaments/${tournamentId}/id_and_faction_data`, altFetch);
  }

  loadCutStats(tournamentId: number, altFetch = fetch): Promise<CutStats> {
    return this.api.getOrThrow<CutStats>(`/beta/tournaments/${tournamentId}/cut_conversion_rates`, altFetch);
  }

  loadCurrentRoundTimer(tournamentId: number, altFetch = fetch): Promise<RoundTimer> {
    return this.api.getOrThrow<RoundTimer>(`/beta/tournaments/${tournamentId}/current_round_timer`, altFetch, "");
  }

  loadIdentityNames(altFetch = fetch): Promise<IdentityNames> {
    return this.api.getOrThrow<IdentityNames>("/beta/identities", altFetch);
  }

  loadPlayers(tournamentId: number, altFetch = fetch): Promise<PlayersData> {
    return this.api.getOrThrow<PlayersData>(`/beta/tournaments/${tournamentId}/players/players_data`, altFetch);
  }

  setPlayerRegistrationStatus(tournamentId: number, locked: boolean): Promise<boolean> {
    const action = locked ? "lock_player_registrations" : "unlock_player_registrations";
    return this.api.patchAction(`/beta/tournaments/${tournamentId}/${action}`);
  }

  setRegistrationStatus(tournamentId: number, open: boolean): Promise<boolean> {
    const action = open ? "open_registration" : "close_registration";
    return this.api.patchAction(`/beta/tournaments/${tournamentId}/${action}`);
  }

  loadDecks(tournamentId: number, playerId?: number, altFetch = fetch): Promise<Deck[]> {
    const path =
      playerId === undefined
        ? `/beta/tournaments/${tournamentId}/players/decks`
        : `/beta/tournaments/${tournamentId}/players/${playerId}/decks`;
    return this.api.getOrThrow<Deck[]>(path, altFetch);
  }

  loadNrdbDecks(tournamentId: number, playerId: number, altFetch = fetch): Promise<NrdbDeck[]> {
    return this.api.getOrThrow<NrdbDeck[]>(
      `/beta/tournaments/${tournamentId}/players/${playerId}/nrdb_decks`,
      altFetch,
    );
  }

  async saveTournament(tournament: Tournament): Promise<boolean> {
    const res = await this.api.patch(`/beta/tournaments/${tournament.id}`, tournament);
    if (!res.ok) {
      globalMessages.errors = [res.error.message];
      return false;
    }
    return true;
  }

  changePlayerSide(
    tournamentId: number,
    roundId: number,
    pairingId: number,
    side: string,
    altFetch = fetch,
  ): Promise<boolean> {
    return this.api.postAction(
      `/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}/report`,
      { side: `player1_is_${side}` },
      { altFetch },
    );
  }

  async reportScore(
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

    const res = await this.api.post(
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

  completeRound(tournamentId: number, roundId: number, completed: boolean): Promise<boolean> {
    return this.api.patchAction(`/beta/tournaments/${tournamentId}/rounds/${roundId}/complete`, { completed });
  }

  updateRoundTimer(
    tournamentId: number,
    roundId: number,
    length_minutes: number,
    operation: string,
  ): Promise<boolean> {
    return this.api.patchAction(`/beta/tournaments/${tournamentId}/rounds/${roundId}/update_timer`, {
      length_minutes,
      operation,
    });
  }

  resetReports(
    tournamentId: number,
    roundId: number,
    pairingId: number,
    altFetch = fetch,
  ): Promise<boolean> {
    return this.api.deleteAction(
      `/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}/reset_self_report`,
      undefined,
      { altFetch },
    );
  }

  createStage(tournamentId: number, cutSingleElim?: boolean, cutCount?: number): Promise<boolean> {
    const isCut = cutSingleElim !== undefined && cutCount !== undefined;
    const path = isCut
      ? `/beta/tournaments/${tournamentId}/cut`
      : `/beta/tournaments/${tournamentId}/stages`;
    const body = isCut
      ? { number: cutCount, ...(cutSingleElim ? { elimination_type: "single" } : {}) }
      : null;

    return this.api.postAction(path, body);
  }

  createPairing(tournamentId: number, roundId: number, newPairing: NewPairing): Promise<boolean> {
    return this.api.postAction(`/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings`, {
      pairing: newPairing,
    });
  }

  deletePairing(tournamentId: number, roundId: number, pairingId: number): Promise<boolean> {
    return this.api.deleteAction(`/beta/tournaments/${tournamentId}/rounds/${roundId}/pairings/${pairingId}`);
  }

  private async deleteWithConfirmation(
    path: string,
    confirmationName: string,
    entityName: string,
    altFetch = fetch,
  ): Promise<boolean> {
    const res = await this.api.delete(path, { confirmation_name: confirmationName }, { altFetch });

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

  deleteTournament(tournamentId: number, confirmationName: string, altFetch = fetch): Promise<boolean> {
    return this.deleteWithConfirmation(
      `/beta/tournaments/${tournamentId}`,
      confirmationName,
      "tournament",
      altFetch,
    );
  }

  deleteStage(tournamentId: number, stageId: number, confirmationName: string, altFetch = fetch): Promise<boolean> {
    return this.deleteWithConfirmation(
      `/beta/tournaments/${tournamentId}/stages/${stageId}`,
      confirmationName,
      "stage",
      altFetch,
    );
  }

  loadRound(tournamentId: number, roundId: number, altFetch = fetch): Promise<RoundData> {
    return this.api.getOrThrow<RoundData>(
      `/beta/tournaments/${tournamentId}/rounds/${roundId}/round_data`,
      altFetch,
    );
  }

  pairRound(tournamentId: number): Promise<boolean> {
    return this.api.postAction(`/beta/tournaments/${tournamentId}/rounds`);
  }

  rePairRound(tournamentId: number, roundId: number): Promise<boolean> {
    return this.api.patchAction(`/beta/tournaments/${tournamentId}/rounds/${roundId}/repair`);
  }

  deleteRound(tournamentId: number, roundId: number): Promise<boolean> {
    return this.api.deleteAction(`/beta/tournaments/${tournamentId}/rounds/${roundId}`);
  }

  saveSOSWeighting(tournamentId: number, roundId: number, weight: number): Promise<boolean> {
    return this.api.patchAction(`/beta/tournaments/${tournamentId}/rounds/${roundId}`, { weight });
  }
}

export const betaApi = new BetaApi();
