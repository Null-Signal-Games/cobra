import { type Pairing, type Stage } from "./PairingsData";

declare const Routes: {
  self_report_tournament_round_pairing_path: (
    tournamentId: number,
    roundId: number,
    id: number,
  ) => string;
};

export async function selfReport(
  tournamentId: number,
  roundId: number,
  pairingId: number,
  csrfToken: string,
  data: ScoreReport,
): Promise<SelfReportResult> {
  // Remove UI-specific data to prevent parameter errors on the server
  const cleanData = { ...data };
  delete cleanData.label;
  delete cleanData.extra_self_report_label;

  const response = await fetch(
    Routes.self_report_tournament_round_pairing_path(
      tournamentId,
      roundId,
      pairingId,
    ),
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "X-CSRF-Token": csrfToken,
      },
      body: JSON.stringify({ pairing: cleanData }),
    },
  );
  return (await response.json()) as SelfReportResult;
}

export interface ScoreReport {
  report_player_id?: number;
  score1: number | null;
  score2: number | null;
  score1_corp: number | null;
  score2_corp: number | null;
  score1_runner: number | null;
  score2_runner: number | null;
  intentional_draw: boolean;
  two_for_one?: boolean;
  label?: string;
  extra_self_report_label?: string;
}

export type SelfReportResult =
  | { success: true }
  | { success: false; error: string };

export function reportsMatch(report1: ScoreReport, report2: ScoreReport): boolean {
  return report1.score1 === report2.score1 && report1.score2 === report2.score2;
}

export function scorePresets(stage: Stage, pairing: Pairing) {
  if (!stage.is_elimination && !stage.is_single_sided)
  {
    return [
      { score1_corp: 3, score2_runner: 0, score1_runner: 3, score2_corp: 0, intentional_draw: false, label: '6-0' },
      { score1_corp: 3, score2_runner: 0, score1_runner: 0, score2_corp: 3, intentional_draw: false, label: '3-3 (C)' },
      { score1_corp: 0, score2_runner: 3, score1_runner: 3, score2_corp: 0, intentional_draw: false, label: '3-3 (R)' },
      { score1_corp: 0, score2_runner: 3, score1_runner: 0, score2_corp: 3, intentional_draw: false, label: '0-6' }
    ] as ScoreReport[];
  }

  if (!stage.is_elimination && stage.is_single_sided) {
    return pairing.player1.side == "corp"
      ? [
          { score1_corp: 3, score2_corp: 0, score1_runner: 0, score2_runner: 0, intentional_draw: false, label: 'Corp Win' },
          { score1_corp: 1, score2_corp: 0, score1_runner: 0, score2_runner: 1, intentional_draw: false, label: 'Tie' },
          { score1_corp: 1, score2_corp: 0, score1_runner: 0, score2_runner: 1, intentional_draw: true, label: 'Intentional Draw' },
          { score1_corp: 0, score2_corp: 0, score1_runner: 0, score2_runner: 3, intentional_draw: false, label: 'Runner Win' }
        ] as ScoreReport[]
      : [
          { score1_corp: 0, score2_corp: 3, score1_runner: 0, score2_runner: 0, intentional_draw: false, label: 'Corp Win' },
          { score1_corp: 0, score2_corp: 1, score1_runner: 1, score2_runner: 0, intentional_draw: false, label: 'Tie' },
          { score1_corp: 0, score2_corp: 1, score1_runner: 1, score2_runner: 0, intentional_draw: true, label: 'Intentional Draw' },
          { score1_corp: 0, score2_corp: 0, score1_runner: 3, score2_runner: 0, intentional_draw: false, label: 'Runner Win' }
        ] as ScoreReport[];
  }

  if (stage.is_elimination && (pairing.player1.side || pairing.player2.side))
  {
    return pairing.player1.side == "corp"
      ? [
          { score1: 3, score2: 0, score1_corp: 3, score2_runner: 0, score1_runner: 0, score2_corp: 0, intentional_draw: false, label: '3-0', extra_self_report_label: `${pairing.player1.name} wins` },
          { score1: 0, score2: 3, score1_corp: 0, score2_runner: 3, score1_runner: 0, score2_corp: 0, intentional_draw: false, label: '0-3', extra_self_report_label: `${pairing.player2.name} wins` }
        ] as ScoreReport[]
      : [
          { score1: 0, score1_corp: 0, score1_runner: 0, score2: 3, score2_corp: 3, score2_runner: 0, intentional_draw: false, label: '3-0', extra_self_report_label: `${pairing.player2.name} wins` },
          { score1: 3, score1_corp: 0, score1_runner: 3, score2: 0, score2_corp: 0, score2_runner: 0, intentional_draw: false, label: '0-3', extra_self_report_label: `${pairing.player1.name} wins` }
        ] as ScoreReport[];
  }

  return [
    { score1: 3, score2: 0, score1_corp: 0, score2_runner: 0, score1_runner: 0, score2_corp: 0, intentional_draw: false, label: '3-0' },
    { score1: 0, score2: 3, score1_corp: 0, score2_runner: 0, score1_runner: 0, score2_corp: 0, intentional_draw: false, label: '0-3' }
  ] as ScoreReport[];
}

export function readableReportScore(report: ScoreReport, player1Side: string | null, isSingleSided: boolean): string {
  if (report.score1 === 0 && report.score2 === 0) {
    return "-";
  }

  let leftScore = report.score1;
  let rightScore = report.score2;
  if (isSingleSided && player1Side === "runner") {
    leftScore = report.score2;
    rightScore = report.score1;
  }

  const str = `${leftScore} - ${rightScore}`;
  const ws = winningSide(report);
  return ws !== "" ? `${str} (${ws})` : str;
}

function winningSide(report: ScoreReport) {
  const corpScore = (report.score1_corp ?? 0) + (report.score2_corp ?? 0);
  const runnerScore = (report.score1_runner ?? 0) + (report.score2_runner ?? 0);

  if (corpScore === runnerScore) {
    return "";
  }

  return corpScore > runnerScore ? "C" : "R";
}
