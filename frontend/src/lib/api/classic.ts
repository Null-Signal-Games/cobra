import { api } from "$lib/api/apiBase";
import type { PairingsData } from "$lib/api/betaTypes";
import type {
  TournamentCreateResponse,
  TournamentSettingsData,
  SaveStageResponse,
  Stage,
  StageData,
} from "$lib/api/classicTypes";
import { ValidationError as StageValidationError } from "$lib/api/classicTypes";
import type { BracketData } from "$lib/model/Bracket";
import type { StandingsData } from "$lib/model/Standings";
import type { Tournament } from "$lib/model/Tournament";
import { ValidationError, type Errors } from "$lib/utils/errors";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

async function assertOkOrValidationError(response: Response): Promise<void> {
  if (!response.ok) {
    if (response.status === 422) {
      const errorData = (await response.json()) as { errors: Errors };
      throw new ValidationError(errorData.errors);
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}

export async function loadPairingsForUser(
  tournamentId: number,
  userId: number,
  altFetch = fetch,
): Promise<PairingsData | null> {
  const res = await api.get<PairingsData>(
    `/tournaments/${tournamentId}/rounds/pairings_data/${userId}`,
    { altFetch },
  );

  if (!res.ok) {
    globalMessages.errors.push(`Error loading pairings for user ${userId}.`);
    return null;
  }

  globalMessages.warnings = res.data.warnings ?? [];
  return res.data;
}

export const loadStandings = (tournamentId: number, altFetch = fetch): Promise<StandingsData> =>
  api.getOrThrow<StandingsData>(
    `/tournaments/${tournamentId}/players/standings_data`,
    altFetch,
    "Failed to load standings",
  );

export const loadBrackets = (tournamentId: number, altFetch = fetch): Promise<BracketData> =>
  api.getOrThrow<BracketData>(
    `/tournaments/${tournamentId}/rounds/brackets`,
    altFetch,
    "Failed to load bracket",
  );

export const loadNewTournament = (altFetch = fetch): Promise<TournamentSettingsData> =>
  api.getOrThrow<TournamentSettingsData>("/tournaments/new_form", altFetch);

export const loadTournamentSettings = (
  tournamentId: number,
  altFetch = fetch,
): Promise<TournamentSettingsData> =>
  api.getOrThrow<TournamentSettingsData>(`/tournaments/${tournamentId}/edit_form`, altFetch);

export async function loadStage(
  tournamentId: number,
  stageId: number,
  altFetch = fetch,
): Promise<StageData> {
  const data = await api.getOrThrow<StageData>(
    `/tournaments/${tournamentId}/stages/${stageId}/settings`,
    altFetch,
  );
  globalMessages.warnings = data.warning ? [data.warning] : [];
  return data;
}

export async function createTournament(tournament: Tournament): Promise<TournamentCreateResponse> {
  const response = await api.rawRequest("/tournaments", "POST", {
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    },
    body: { tournament },
  });

  await assertOkOrValidationError(response);

  return (await response.json()) as TournamentCreateResponse;
}

export async function updateTournamentSettings(tournament: Tournament): Promise<boolean> {
  const response = await api.rawRequest(`/tournaments/${tournament.id}`, "PATCH", {
    body: { tournament },
  });

  await assertOkOrValidationError(response);

  return true;
}

export async function saveStage(
  tournamentId: number,
  stage: Stage,
  altFetch = fetch,
): Promise<SaveStageResponse> {
  const response = await api.rawRequest(
    `/tournaments/${tournamentId}/stages/${stage.id}`,
    "PATCH",
    {
      altFetch,
      body: { stage },
    },
  );

  const saveStageResponse = (await response.json()) as SaveStageResponse;

  if (!response.ok) {
    if (response.status === 422) {
      throw new StageValidationError(saveStageResponse.error ?? "Stage could not be updated.");
    }

    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return saveStageResponse;
}
