declare const Routes: {
  settings_tournament_stage_path: (
    tournamentId: number,
    stageId: number,
  ) => string;
  tournament_stage_path: (tournamentId: number, stageId: number) => string;
};

export class Stage {
  id = -1;
  tournament_id = -1;
  number = -1;
  format: string | null = null;
  table_ranges: TableRange[] = [];
}

export interface TableRange {
  id?: number;
  stage_id: number;
  first_table: number;
  last_table: number;
}

export class StageData {
  stage = new Stage();
  warning?: string;
  csrf_token = "";
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
): Promise<StageData> {
  const response = await fetch(
    Routes.settings_tournament_stage_path(tournamentId, stageId),
    {
      headers: { Accept: "application/json" },
      method: "GET",
    },
  );
  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status.toString()}: ${response.statusText}`,
    );
  }

  return (await response.json()) as StageData;
}

export async function saveStage(
  csrfToken: string,
  tournamentId: number,
  stage: Stage,
): Promise<SaveStageResponse> {
  const response = await fetch(
    Routes.tournament_stage_path(tournamentId, stage.id),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken,
      },
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
