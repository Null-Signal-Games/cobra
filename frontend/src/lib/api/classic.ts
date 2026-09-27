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

function parseTournamentArgs(
  arg1: Tournament | string | undefined,
  arg2?: Tournament | string,
): { tournament: Tournament; csrfToken?: string } {
  if (typeof arg1 === "object") {
    return { tournament: arg1, csrfToken: typeof arg2 === "string" ? arg2 : undefined };
  }
  if (typeof arg2 !== "object") {
    throw new Error("Tournament is required");
  }
  return { tournament: arg2, csrfToken: arg1 };
}

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

export const loadNewTournament = (
  fetch: typeof globalThis.fetch,
): Promise<TournamentSettingsData> =>
  api.getOrThrow<TournamentSettingsData>("/tournaments/new_form", fetch);

export const loadTournamentSettings = (
  tournamentId: number,
  fetch: typeof globalThis.fetch,
): Promise<TournamentSettingsData> =>
  api.getOrThrow<TournamentSettingsData>(`/tournaments/${tournamentId}/edit_form`, fetch);

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

// TODO: Add <meta name="csrf-token" content={data.tournamentSettings.csrf_token} /> to
// /tournaments/new/+page.svelte so createTournament can drop the explicit csrfToken argument
// and rely entirely on apiBase's automatic CSRF handling.
export async function createTournament(
  csrfToken: string | undefined,
  tournament: Tournament,
): Promise<TournamentCreateResponse>;
export async function createTournament(
  tournament: Tournament,
  csrfToken?: string,
): Promise<TournamentCreateResponse>;
export async function createTournament(
  arg1: string | Tournament | undefined,
  arg2?: Tournament | string,
): Promise<TournamentCreateResponse> {
  const { tournament, csrfToken } = parseTournamentArgs(arg1, arg2);

  const response = await api.rawRequest("/tournaments", "POST", {
    csrfToken,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    },
    body: { tournament },
  });

  await assertOkOrValidationError(response);

  return (await response.json()) as TournamentCreateResponse;
}

export async function updateTournamentSettings(
  csrfToken: string | undefined,
  tournament: Tournament,
): Promise<boolean>;
export async function updateTournamentSettings(
  tournament: Tournament,
  csrfToken?: string,
): Promise<boolean>;
export async function updateTournamentSettings(
  arg1: string | Tournament | undefined,
  arg2?: Tournament | string,
): Promise<boolean> {
  const { tournament, csrfToken } = parseTournamentArgs(arg1, arg2);

  const response = await api.rawRequest(`/tournaments/${tournament.id}`, "PATCH", {
    csrfToken,
    body: { tournament },
  });

  await assertOkOrValidationError(response);

  return true;
}

export async function saveStage(
  tournamentId: number,
  stage: Stage,
  altFetch = fetch,
  token?: string,
): Promise<SaveStageResponse> {
  const response = await api.rawRequest(
    `/tournaments/${tournamentId}/stages/${stage.id}`,
    "PATCH",
    {
      altFetch,
      csrfToken: token,
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
