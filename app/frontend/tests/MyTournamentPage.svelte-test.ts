import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  MockPairing1,
  MockPairingsData,
  MockSelfReportPlayer1Sweep,
} from "./RoundsTestData";
import {
  getByRole,
  getByText,
  queryByRole,
  render,
  waitFor,
} from "@testing-library/svelte";
import MyTournamentPage from "../tournaments/MyTournamentPage.svelte";
import userEvent from "@testing-library/user-event";
import { loadPairings } from "../pairings/PairingsData";
import { reportScore } from "../pairings/SelfReport";

const user = userEvent.setup();

vi.mock("../pairings/PairingsData", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../pairings/PairingsData")>()),
  loadPairings: vi.fn(() => MockPairingsData),
}));

vi.mock("../pairings/SelfReport", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../pairings/SelfReport")>()),
  reportScore: vi.fn(() => true),
}));

describe("MyTournamentPage", () => {
  const componentProps = { tournamentId: 1, userId: 2 };

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(MockPairingsData.policy, "update", "get").mockReturnValue(false);
  });

  describe("self-reporting disabled", () => {
    beforeEach(() => {
      render(MyTournamentPage, componentProps);
    });

    it("does not show the Report Pairing button when self-reporting is not enabled", async () => {
      await waitFor(() => {
        const table = document.getElementById("rounds_table") as HTMLTableElement;
        expect(table).not.toBeNull();
      });
      const table = document.getElementById("rounds_table") as HTMLTableElement;
      const currentRow = table.rows[table.rows.length - 1];
      expect(currentRow).not.toBeNull();
      expect(
        queryByRole(currentRow, "button", { name: /report pairing/i }),
      ).toBeNull();
    });
  });

  describe("self-reporting enabled", () => {
    beforeEach(() => {
      vi.spyOn(MockPairing1.policy, "self_report", "get").mockReturnValue(true);

      render(MyTournamentPage, componentProps);
    });

    describe.each([
      [6, 0, /6-0/i, "6 - 0"],
      [3, 3, /3-3 \(c\)/i, "3 - 3 (C)"],
      [3, 3, /3-3 \(r\)/i, "3 - 3 (R)"],
      [6, 0, /0-6/i, "0 - 6"],
    ])("using preset score", (score1, score2, buttonText, scoreText) => {
      it(scoreText, async () => {
        vi.spyOn(MockPairing1.policy, "self_report", "get").mockReturnValue(
          false,
        );
        vi.spyOn(MockPairing1, "self_reports", "get").mockReturnValue([
          MockSelfReportPlayer1Sweep,
        ]);
        vi.spyOn(MockSelfReportPlayer1Sweep, "score1", "get").mockReturnValue(score1);
        vi.spyOn(MockSelfReportPlayer1Sweep, "score2", "get").mockReturnValue(score2);
        vi.spyOn(MockSelfReportPlayer1Sweep, "label", "get").mockReturnValue(scoreText);

        await waitFor(() => {
          const table = document.getElementById("rounds_table") as HTMLTableElement;
          expect(table).not.toBeNull();
        });

        const table = document.getElementById(
          "rounds_table",
        ) as HTMLTableElement;
        const currentRow = table.rows[table.rows.length - 1];
        await user.click(
          getByRole(currentRow, "button", { name: /report pairing/i }),
        );

        const reportDialog = document.getElementById(`reportModal-${MockPairing1.id}`);
        expect(reportDialog).not.toBeNull();
        if (!reportDialog) {
          return;
        }
        await user.click(getByText(reportDialog, buttonText));

        expect(reportScore).toHaveBeenCalledOnce();
        expect(loadPairings).toHaveBeenCalledTimes(2);
        expect(
          queryByRole(currentRow, "button", { name: /report pairing/i }),
        ).toBeNull();
        expect(getByText(currentRow, `Report: ${scoreText}`)).not.toBeNull();
      });
    });
  });
});
