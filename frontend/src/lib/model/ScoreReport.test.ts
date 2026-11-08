import { describe, it, expect } from "vitest";
import { readableReportScore, type ScoreReport } from "./ScoreReport.ts";

function report(overrides: Partial<ScoreReport>): ScoreReport {
  return {
    score1: null,
    score2: null,
    score1_corp: 0,
    score1_runner: 0,
    score2_corp: 0,
    score2_runner: 0,
    intentional_draw: false,
    ...overrides,
  };
}

describe("readableReportScore", () => {
  it('returns "-" when no score has been entered', () => {
    expect(readableReportScore(report({}), null, false)).toBe("-");
  });

  it('returns "0 - 0" for a 0-0 report', () => {
    expect(readableReportScore(report({ score1: 0, score2: 0 }), null, false)).toBe("0 - 0");
  });

  it("includes the winning side", () => {
    expect(
      readableReportScore(report({ score1: 3, score2: 0, score1_corp: 3 }), "corp", true),
    ).toBe("3 - 0 (C)");
  });
});
