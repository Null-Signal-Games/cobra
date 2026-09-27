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
