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
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

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

export const createTournament = (tournament: Tournament): Promise<TournamentCreateResponse> =>
  api.postOrThrow<TournamentCreateResponse>("/tournaments", { tournament });

export const updateTournamentSettings = async (tournament: Tournament): Promise<boolean> => {
  await api.patchOrThrow(`/tournaments/${tournament.id}`, { tournament });
  return true;
};

export async function saveStage(
  tournamentId: number,
  stage: Stage,
  altFetch = fetch,
): Promise<SaveStageResponse> {
  const res = await api.patch<SaveStageResponse>(
    `/tournaments/${tournamentId}/stages/${stage.id}`,
    { stage },
    { altFetch },
  );

  if (!res.ok) {
    if (res.status === 422) {
      throw new StageValidationError(res.error.message || "Stage could not be updated.");
    }
    throw res.error;
  }

  return res.data;
}
