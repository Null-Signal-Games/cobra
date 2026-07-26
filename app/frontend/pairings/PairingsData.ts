import type { Identity } from "../identities/Identity";
import type { Player } from "../players/PlayersData";
import { Tournament } from "../tournaments/TournamentSettings";
import { globalMessages } from "../utils/GlobalMessageState.svelte";
import { csrfToken } from "../utils/network";
import type { ScoreReport } from "./SelfReport";

declare const Routes: {
  markdown_tournament_round_pairings_path: (
    tournamentId: number,
    roundId: number,
  ) => string;
  beta_tournament_round_pairings_path: (
    tournamentId: number,
    roundId: number,
  ) => string;
  beta_tournament_round_pairing_path: (
    tournamentId: number,
    roundId: number,
    pairingId: number,
  ) => string;
  pairings_data_tournament_rounds_path: (tournamentId: number) => string;
  pairings_data_beta_tournament_rounds_path: (tournamentId: number) => string;
  repair_beta_tournament_round_path: (
    tournamentId: number,
    roundId: number,
  ) => string;
  complete_beta_tournament_round_path: (
    tournamentId: number,
    roundId: number,
  ) => string;
  beta_tournament_path: (tournamentId: number) => string;
  beta_tournament_rounds_path: (tournamentId: number) => string;
  beta_tournament_round_path: (tournamentId: number, roundId: number) => string;
  beta_tournament_stages_path: (tournamentId: number) => string;
  beta_tournament_stage_path: (tournamentId: number, stageId: number) => string;
  cut_beta_tournament_path: (tournamentId: number) => string;
  open_registration_beta_tournament_path: (tournamentId: number) => string;
  close_registration_beta_tournament_path: (tournamentId: number) => string;
  unlock_player_registrations_beta_tournament_path: (
    tournamentId: number,
  ) => string;
  lock_player_registrations_beta_tournament_path: (
    tournamentId: number,
  ) => string;
  update_timer_beta_tournament_round_path: (
    tournamentId: number,
    roundId: number,
  ) => string;
  id_and_faction_data_beta_tournament_path: (tournamentId: number) => string;
  cut_conversion_rates_beta_tournament_path: (tournamentId: number) => string;
};

export async function loadPairings(
  tournamentId: number,
  userId: number | null = null,
) {
  const betaEnabledCookie = await cookieStore.get("beta_enabled");

  const url = userId
    ? `/tournaments/${tournamentId}/rounds/pairings_data/${userId}`
    : betaEnabledCookie?.value === "true"
      ? Routes.pairings_data_beta_tournament_rounds_path(tournamentId)
      : Routes.pairings_data_tournament_rounds_path(tournamentId);

  const response = await fetch(url, {
    method: "GET",
  });

  const data = (await response.json()) as PairingsData;
  globalMessages.warnings = data.warnings ?? [];

  return data;
}

export async function loadSharingData(
  tournamentId: number,
  roundId: number,
): Promise<SharingData> {
  const response = await fetch(
    Routes.markdown_tournament_round_pairings_path(tournamentId, roundId),
    {
      method: "GET",
    },
  );

  return (await response.json()) as SharingData;
}

export async function createPairing(
  tournamentId: number,
  roundId: number,
  newPairing: NewPairing,
): Promise<boolean> {
  const response = await fetch(
    Routes.beta_tournament_round_pairings_path(tournamentId, roundId),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
      body: JSON.stringify({ pairing: newPairing }),
    },
  );

  return response.status === 200;
}

export async function deletePairing(
  tournamentId: number,
  roundId: number,
  pairingId: number,
): Promise<boolean> {
  const response = await fetch(
    Routes.beta_tournament_round_pairing_path(tournamentId, roundId, pairingId),
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
    },
  );

  return response.status === 200;
}

export async function pairRound(tournamentId: number) {
  const response = await fetch(
    Routes.beta_tournament_rounds_path(tournamentId),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
    },
  );

  return response.status === 200;
}

export async function rePairRound(
  tournamentId: number,
  roundId: number,
): Promise<boolean> {
  const response = await fetch(
    Routes.repair_beta_tournament_round_path(tournamentId, roundId),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
    },
  );

  return response.status === 200;
}

export async function completeRound(
  tournamentId: number,
  roundId: number,
  completed: boolean,
): Promise<boolean> {
  const response = await fetch(
    Routes.complete_beta_tournament_round_path(tournamentId, roundId),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
      body: JSON.stringify({ completed: completed }),
    },
  );

  return response.status === 200;
}

export async function deleteRound(
  tournamentId: number,
  roundId: number,
): Promise<boolean> {
  const response = await fetch(
    Routes.beta_tournament_round_path(tournamentId, roundId),
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
    },
  );

  return response.status === 200;
}

export async function createStage(
  tournamentId: number,
  cutSingleElim?: boolean,
  cutCount?: number,
) {
  const isCut = cutSingleElim !== undefined && cutCount !== undefined;
  const path = isCut
    ? Routes.cut_beta_tournament_path(tournamentId)
    : Routes.beta_tournament_stages_path(tournamentId);
  const body = isCut
    ? { number: cutCount, ...(cutSingleElim && { elimination_type: "single" }) }
    : null;

  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken(),
    },
    body: JSON.stringify(body),
  });

  return response.status === 200;
}

export async function deleteStage(
  tournamentId: number,
  stageId: number,
): Promise<boolean> {
  const response = await fetch(
    Routes.beta_tournament_stage_path(tournamentId, stageId),
    {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
    },
  );

  return response.status === 200;
}

export async function setRegistrationStatus(
  tournamentId: number,
  open: boolean,
): Promise<boolean> {
  const path = open
    ? Routes.open_registration_beta_tournament_path(tournamentId)
    : Routes.close_registration_beta_tournament_path(tournamentId);

  const response = await fetch(path, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken(),
    },
  });

  return response.status === 200;
}

export async function setPlayerRegistrationStatus(
  tournamentId: number,
  locked: boolean,
): Promise<boolean> {
  const path = locked
    ? Routes.lock_player_registrations_beta_tournament_path(tournamentId)
    : Routes.unlock_player_registrations_beta_tournament_path(tournamentId);

  const response = await fetch(path, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken(),
    },
  });

  return response.status === 200;
}

export async function saveTournament(tournament: Tournament): Promise<boolean> {
  const response = await fetch(Routes.beta_tournament_path(tournament.id), {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-CSRF-Token": csrfToken(),
    },
    body: JSON.stringify(tournament),
  });

  if (response.status !== 200) {
    const data = (await response.json()) as { errors?: string[] };
    globalMessages.errors = data.errors ?? [];
  }

  return response.status === 200;
}

export async function updateRoundTimer(
  tournamentId: number,
  roundId: number,
  length_minutes: number,
  operation: string,
): Promise<boolean> {
  const response = await fetch(
    Routes.update_timer_beta_tournament_round_path(tournamentId, roundId),
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken(),
      },
      body: JSON.stringify({
        length_minutes: length_minutes,
        operation: operation,
      }),
    },
  );

  return response.status === 200;
}

export async function loadStats(tournamentId: number): Promise<Stats> {
  const response = await fetch(
    Routes.id_and_faction_data_beta_tournament_path(tournamentId),
    {
      method: "GET",
    },
  );

  return (await response.json()) as Stats;
}

export async function loadCutStats(tournamentId: number): Promise<CutStats> {
  const response = await fetch(
    Routes.cut_conversion_rates_beta_tournament_path(tournamentId),
    {
      method: "GET",
    },
  );

  return (await response.json()) as CutStats;
}

export interface NewPairing {
  table_number: number;
  player1_id: number;
  side: string;
  player2_id: number;
}

export interface PairingsContext {
  showOrganizerView: boolean;
}

export class PairingsData {
  policy = new TournamentPolicies();
  tournament = new Tournament();
  stages: Stage[] = [];
  warnings?: string[] = [];
}

export class TournamentPolicies {
  update = false;
  custom_table_numbering = false;
}

export class SharingData {
  pages: string[];

  constructor() {
    this.pages = [];
  }
}

export interface Stage {
  id: number;
  name: string;
  format: string;
  is_single_sided: boolean;
  is_elimination: boolean;
  view_decks: boolean;
  rounds: Round[];
}

export interface Round {
  id: number;
  number: number;
  completed: boolean;
  pairings: Pairing[];
  pairings_reported: number;
  unpaired_players?: Player[];
  length_minutes: number;
  timer: RoundTimer;
}

export interface RoundTimer {
  running: boolean;
  paused: boolean;
  started: boolean;
}

export interface PlayerSource {
  method: "winner" | "loser";
  game: number;
}

export type PredecessorMap = Record<number, PlayerSource[]>;

export interface Pairing {
  id: number;
  table_number: number;
  table_label: string;
  policy: PairingPolicies;
  player1: Player;
  player2: Player;
  score1: number;
  score1_corp: number;
  score1_runner: number;
  score2: number;
  score2_corp: number;
  score2_runner: number;
  score_label: string;
  intentional_draw: boolean;
  two_for_one: boolean;
  self_reports: ScoreReport[] | null;
  reported: boolean;
  winner_game: number | null;
  loser_game: number | null;
  bracket_type: string | null;
  ui_metadata: UiMetadata;
}

export interface UiMetadata {
  row_highlighted: boolean;
}

export interface SelfReport {
  report_player_id: number;
  score1: number;
  score2: number;
  intentional_draw: boolean;
  label: string | null;
}

export interface PairingPolicies {
  view_decks?: boolean;
  self_report: boolean;
}

export interface IdStats {
  identity: Identity;
  count: number;
}

export interface FactionStats {
  name: string;
  count: number;
}

export interface CutIdStats {
  identity: Identity;
  numSwissPlayers: number;
  numCutPlayers: number;
  cutConversion: number;
}

export interface CutFactionStats {
  name: string;
  numSwissPlayers: number;
  numCutPlayers: number;
  cutConversion: number;
}

export interface StageStats {
  num_players: number;
  corp: {
    ids: IdStats[];
    factions: FactionStats[];
  };
  runner: {
    ids: IdStats[];
    factions: FactionStats[];
  };
}

export interface Stats {
  swiss: StageStats;
  elim: StageStats;
}

export interface CutStats {
  corp: {
    ids: CutIdStats[];
    factions: CutFactionStats[];
  };
  runner: {
    ids: CutIdStats[];
    factions: CutFactionStats[];
  };
}
