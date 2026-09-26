import { COBRA_API_SERVER } from "$app/env/public";
import { csrfToken } from "$lib/csrf";
import type { PairingsData } from "$lib/api/betaTypes";
import type { 
  TournamentCreateErrorResponse, 
  TournamentCreateResponse, 
  TournamentSettingsData,
  SaveStageResponse, 
  Stage,
  StageData 
} from "$lib/api/classicTypes";
import { ValidationError as StageValidationError } from "$lib/api/classicTypes";
import type { BracketData } from "$lib/model/Bracket";
import type { StandingsData } from "$lib/model/Standings";
import type { Tournament } from "$lib/model/Tournament";
import { ValidationError, type Errors } from "$lib/utils/errors";
import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";

const apiServer = (COBRA_API_SERVER || "").replace(/\/$/, "");

export async function loadPairingsForUser(
  tournamentId: number,
  userId: number,
  altFetch = fetch,
) {
  const url = `${apiServer}/tournaments/${tournamentId}/rounds/pairings_data/${userId}`;

  const response = await altFetch(url, {
    method: "GET",
    credentials: "include",
  });

  const data = (await response.json()) as PairingsData;
  globalMessages.warnings = data.warnings ?? [];

  return data;
}

export async function loadStandings(tournamentId: number, altFetch = fetch): Promise<StandingsData> {
  const response = await altFetch(
    `${apiServer}/tournaments/${tournamentId}/players/standings_data`,
    {
      method: "GET",
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to load standings: ${response.statusText}`);
  }
  return (await response.json()) as StandingsData;
}


export async function loadBrackets(tournamentId: number, altFetch = fetch): Promise<BracketData> {
  const response = await altFetch(
    `${apiServer}/tournaments/${tournamentId}/rounds/brackets`,
    {
      method: "GET",
    },
  );

  return (await response.json()) as BracketData;
}

export async function loadNewTournament(
  fetch: typeof globalThis.fetch,
): Promise<TournamentSettingsData> {
  const response = await fetch(`${apiServer}/tournaments/new_form`, {
    credentials: "include",
    headers: { Accept: "application/json" },
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status.toString()}: ${response.statusText}`);
  }

  return (await response.json()) as TournamentSettingsData;
}

export async function createTournament(
  csrfToken: string,
  tournament: Tournament,
): Promise<TournamentCreateResponse> {
  const response = await fetch(`${apiServer}/tournaments`, {
    method: "POST",
    credentials: "include",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ tournament }),
  });

  if (!response.ok) {
    if (response.status === 422) {
      const errorData = (await response.json()) as TournamentCreateErrorResponse;
      throw new ValidationError(errorData.errors);
    }
    throw new Error(`HTTP ${response.status.toString()}: ${response.statusText}`);
  }

  return (await response.json()) as TournamentCreateResponse;
}

export async function loadTournamentSettings(
  tournamentId: number,
  fetch: typeof globalThis.fetch,
): Promise<TournamentSettingsData> {
  const response = await fetch(`${apiServer}/tournaments/${tournamentId}/edit_form`, {
    credentials: "include",
    headers: { Accept: "application/json" },
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return (await response.json()) as TournamentSettingsData;
}

export async function updateTournamentSettings(
  csrfToken: string,
  tournament: Tournament,
): Promise<boolean> {
  const response = await fetch(`${apiServer}/tournaments/${tournament.id}`, {
    method: "PATCH",
    credentials: "include",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-CSRF-Token": csrfToken,
    },
    body: JSON.stringify({ tournament }),
  });
  if (!response.ok) {
    if (response.status === 422) {
      const errorData = (await response.json()) as { errors: Errors };
      throw new ValidationError(errorData.errors);
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return true;
}

export async function loadStage(
  tournamentId: number,
  stageId: number,
  altFetch = fetch,
): Promise<StageData> {
  const response = await altFetch(
    `${apiServer}/tournaments/${tournamentId}/stages/${stageId}/settings`,
    {
      headers: { Accept: "application/json" },
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status.toString()}: ${response.statusText}`,
    );
  }

  const data = (await response.json()) as StageData;
  globalMessages.warnings = data.warning ? [data.warning] : [];

  return data;
}

export async function saveStage(
  tournamentId: number,
  stage: Stage,
  altFetch = fetch,
  token = csrfToken(),
): Promise<SaveStageResponse> {
  const response = await altFetch(
    `${apiServer}/tournaments/${tournamentId}/stages/${stage.id}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": token,
      },
      credentials: "include",
      body: JSON.stringify({ stage }),
    },
  );

  const saveStageResponse = (await response.json()) as SaveStageResponse;

  if (!response.ok) {
    if (response.status === 422) {
      throw new StageValidationError(
        saveStageResponse.error ?? "Stage could not be updated.",
      );
    }

    throw new Error(
      `HTTP ${response.status.toString()}: ${response.statusText}`,
    );
  }

  return saveStageResponse;
}
