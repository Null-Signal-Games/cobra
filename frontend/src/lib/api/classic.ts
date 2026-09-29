import { api as defaultApi, type ApiBase } from "$lib/api/apiBase";
import type { PairingsData } from "$lib/api/betaTypes";
import type {
  TournamentCreateResponse,
  TournamentSettingsData,
  SaveStageResponse,
  Stage,
  StageData,
} from "$lib/api/classicTypes";
import type { BracketData } from "$lib/model/Bracket";
import type { StandingsData } from "$lib/model/Standings";
import type { Tournament } from "$lib/model/Tournament";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

export class ClassicApi {
  constructor(private api: ApiBase = defaultApi) {}

  async loadPairingsForUser(
    tournamentId: number,
    userId: number,
    altFetch = fetch,
  ): Promise<PairingsData | null> {
    const res = await this.api.get<PairingsData>(
      `/tournaments/${tournamentId}/rounds/pairings_data/${userId}`,
      { altFetch },
    );

    if (!res.ok) {
      globalMessages.errors.push(`Error loading pairings for user ${userId}.`);
      return null;
    }

    return res.data;
  }

  loadStandings(tournamentId: number, altFetch = fetch): Promise<StandingsData> {
    return this.api.getOrThrow<StandingsData>(
      `/tournaments/${tournamentId}/players/standings_data`,
      altFetch,
      "Failed to load standings",
    );
  }

  loadBrackets(tournamentId: number, altFetch = fetch): Promise<BracketData> {
    return this.api.getOrThrow<BracketData>(
      `/tournaments/${tournamentId}/rounds/brackets`,
      altFetch,
      "Failed to load bracket",
    );
  }

  loadNewTournament(altFetch = fetch): Promise<TournamentSettingsData> {
    return this.api.getOrThrow<TournamentSettingsData>("/tournaments/new_form", altFetch);
  }

  loadTournamentSettings(
    tournamentId: number,
    altFetch = fetch,
  ): Promise<TournamentSettingsData> {
    return this.api.getOrThrow<TournamentSettingsData>(
      `/tournaments/${tournamentId}/edit_form`,
      altFetch,
    );
  }

  loadStage(
    tournamentId: number,
    stageId: number,
    altFetch = fetch,
  ): Promise<StageData> {
    return this.api.getOrThrow<StageData>(
      `/tournaments/${tournamentId}/stages/${stageId}/settings`,
      altFetch,
    );
  }

  createTournament(tournament: Tournament): Promise<TournamentCreateResponse> {
    return this.api.postOrThrow<TournamentCreateResponse>("/tournaments", { tournament });
  }

  async updateTournamentSettings(tournament: Tournament): Promise<boolean> {
    await this.api.patchOrThrow(`/tournaments/${tournament.id}`, { tournament });
    return true;
  }

  saveStage(
    tournamentId: number,
    stage: Stage,
    altFetch = fetch,
  ): Promise<SaveStageResponse> {
    return this.api.patchOrThrow<SaveStageResponse>(
      `/tournaments/${tournamentId}/stages/${stage.id}`,
      { stage },
      { altFetch },
    );
  }
}

export const classicApi = new ClassicApi();
