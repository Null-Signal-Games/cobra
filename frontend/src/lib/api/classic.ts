import { api as defaultApi, type ApiBase } from "$lib/api/apiBase";
import type { PairingsData } from "$lib/api/betaTypes";
import type {
  AbrUploadResponse,
  DemoTournamentSettings,
  DemoTournamentSettingsData,
  TournamentCreateResponse,
  TournamentDemoCreateResponse,
  TournamentSettingsData,
  SaveStageResponse,
  Stage,
  StageData,
} from "$lib/api/classicTypes";
import type { BracketData } from "$lib/model/Bracket";
import type { StandingsData } from "$lib/model/Standings";
import type { Tournament } from "$lib/model/Tournament";
import { addError } from "$lib/utils/GlobalMessageState.svelte";

export class ClassicApi {
  constructor(private api: ApiBase = defaultApi) {}

  async loadCsrfToken(altFetch = fetch): Promise<string> {
    const data = await this.api.getOrThrow<{ csrf_token: string }>(
      "/api/classic/csrf_token",
      altFetch,
      "Failed to load CSRF token",
    );
    return data.csrf_token;
  }

  async loadPairingsForUser(
    tournamentId: number,
    userId: number,
    altFetch = fetch,
  ): Promise<PairingsData | null> {
    const res = await this.api.get<PairingsData>(
      `/api/classic/tournaments/${tournamentId}/rounds/pairings_data/${userId}`,
      { altFetch },
    );

    if (!res.ok) {
      addError(`Error loading pairings for user ${userId}.`);
      return null;
    }

    return res.data;
  }

  loadStandings(tournamentId: number, altFetch = fetch): Promise<StandingsData> {
    return this.api.getOrThrow<StandingsData>(
      `/api/classic/tournaments/${tournamentId}/players/standings_data`,
      altFetch,
      "Failed to load standings",
    );
  }

  loadBrackets(tournamentId: number, altFetch = fetch): Promise<BracketData> {
    return this.api.getOrThrow<BracketData>(
      `/api/classic/tournaments/${tournamentId}/rounds/brackets`,
      altFetch,
      "Failed to load bracket",
    );
  }

  loadNewTournament(altFetch = fetch): Promise<TournamentSettingsData> {
    return this.api.getOrThrow<TournamentSettingsData>(
      "/api/classic/tournaments/new_form",
      altFetch,
    );
  }

  loadNewDemoTournament(altFetch = fetch): Promise<DemoTournamentSettingsData> {
    return this.api.getOrThrow<DemoTournamentSettingsData>(
      "/api/classic/tournaments/new_demo_form",
      altFetch,
    );
  }

  loadTournamentSettings(tournamentId: number, altFetch = fetch): Promise<TournamentSettingsData> {
    return this.api.getOrThrow<TournamentSettingsData>(
      `/api/classic/tournaments/${tournamentId}/edit_form`,
      altFetch,
    );
  }

  loadStage(tournamentId: number, stageId: number, altFetch = fetch): Promise<StageData> {
    return this.api.getOrThrow<StageData>(
      `/api/classic/tournaments/${tournamentId}/stages/${stageId}/settings`,
      altFetch,
    );
  }

  createTournament(tournament: Tournament): Promise<TournamentCreateResponse> {
    return this.api.postOrThrow<TournamentCreateResponse>("/api/classic/tournaments", {
      tournament,
    });
  }

  createDemoTournament(tournament: DemoTournamentSettings): Promise<TournamentDemoCreateResponse> {
    return this.api.postOrThrow<TournamentDemoCreateResponse>(
      "/api/classic/tournaments/create_demo",
      { tournament },
    );
  }

  async updateTournamentSettings(tournament: Tournament): Promise<boolean> {
    await this.api.patchOrThrow(`/api/classic/tournaments/${tournament.id}`, { tournament });
    return true;
  }

  loadNrtmJson(tournamentId: number, altFetch = fetch): Promise<unknown> {
    return this.api.getOrThrow<unknown>(
      `/api/classic/tournaments/${tournamentId}/save_json`,
      altFetch,
      "Failed to load tournament results",
    );
  }

  uploadToAbr(tournamentId: number): Promise<AbrUploadResponse> {
    return this.api.postOrThrow<AbrUploadResponse>(
      `/api/classic/tournaments/${tournamentId}/upload_to_abr`,
    );
  }

  saveStage(tournamentId: number, stage: Stage, altFetch = fetch): Promise<SaveStageResponse> {
    return this.api.patchOrThrow<SaveStageResponse>(
      `/api/classic/tournaments/${tournamentId}/stages/${stage.id}`,
      { stage },
      { altFetch },
    );
  }
}

export const classicApi = new ClassicApi();
