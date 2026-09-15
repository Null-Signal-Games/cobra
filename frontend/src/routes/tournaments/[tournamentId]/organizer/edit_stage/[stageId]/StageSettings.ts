import { globalMessages } from "$lib/utils/GlobalMessageState.svelte";
import { COBRA_API_SERVER } from "$app/env/public";
import { csrfToken } from "../../../../api_helper";

const apiServer = (COBRA_API_SERVER || "").replace(/\/$/, "");

export interface Stage {
  id: number;
  tournament_id: number;
  number: number;
  format: string | null;
  table_ranges: TableRange[];
}

export interface TableRange {
  id?: number;
  stage_id: number;
  first_table: number;
  last_table: number;
}

export class StageData {
  stage: Stage;
  warning?: string;

  constructor() {
    this.stage = {
      id: -1,
      tournament_id: -1,
      number: -1,
      format: null,
      table_ranges: [],
    };
  }
}

export interface SaveStageResponse {
  url: string;
  error?: string;
}

export class ValidationError extends Error {
  constructor(public errors: string) {
    super("Validation failed");
    this.name = "ValidationError";
  }
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
      throw new ValidationError(
        saveStageResponse.error ?? "Stage could not be updated.",
      );
    }

    throw new Error(
      `HTTP ${response.status.toString()}: ${response.statusText}`,
    );
  }

  return saveStageResponse;
}
