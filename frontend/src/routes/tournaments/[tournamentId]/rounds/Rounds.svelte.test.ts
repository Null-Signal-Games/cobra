/*
  See the comment in /frontend/src/routes/tournaments/[tournamentId]/organizer/rounds/Rounds.svelte.test.ts
  for an explanation of the usage of rerender().
*/

import {
  cleanup,
  getByRole,
  getByText,
  queryByRole,
  render,
  screen,
  within,
} from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reportScore } from "../api_helper";
import RoundsPage from "./+page.svelte";
import type { ScoreReport } from "$lib/model/ScoreReport";
import { Player } from "$lib/model/Player";
import type { PageProps } from "./$types";
import {
  MockSwissStage,
  MockPairing1,
  MockSelfReportPlayer1Sweep,
  MockSelfReportCorpSplit,
  MockSelfReportRunnerSplit,
  MockSelfReportPlayer2Sweep,
  MockTournament,
} from "./RoundsTestData";
import type { TournamentPolicies } from "$lib/model/Tournament";

const MockPolicy: TournamentPolicies = {
  update: false,
  custom_table_numbering: false
};

const MockPageData: PageProps["data"] = {
  tournamentTypes: [],
  tournamentData: {
    tournament: MockTournament,
    csrf_token: ""
  },
  timer: {
    show: false,
    running: false,
    paused: false,
    started: false,
    state: {
      started: false,
      paused: false,
      finish_time: undefined,
      remaining_seconds: undefined,
      length_minutes: undefined
    }
  },
  player: new Player(),
  policy: MockPolicy,
  stages: [MockSwissStage],
};

vi.mock("../api_helper", () => ({
  loadPairings: vi.fn(() => { return { policy: MockPolicy, stages: [MockSwissStage] }; }),
  reportScore: vi.fn(() => true),
}));

const user = userEvent.setup();

describe("Rounds", () => {
  function renderRounds() {
    const props = {
      params: {
        tournamentId: MockTournament.id.toString()
      },
      data: MockPageData,
    };

    return render(RoundsPage, { props: props });
  }

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("as player", () => {
    beforeEach(() => {
      vi.spyOn(MockPolicy, "update", "get").mockReturnValue(false);
    });

    describe("does not show", () => {
      beforeEach(() => {
        renderRounds();
      });

      it("the TO general controls", () => {
        expect(screen.queryByText(/add swiss stage/i)).toBeNull();
        expect(screen.queryByText(/show\/hide reported pairings/i)).toBeNull();
        expect(screen.queryByText(/see player pairings view/i)).toBeNull();
        expect(screen.queryByText(/open registration/i)).toBeNull();
        expect(screen.queryByText(/close registration/i)).toBeNull();
        expect(screen.queryByText(/unlock all players/i)).toBeNull();
        expect(screen.queryByText(/lock all players/i)).toBeNull();
        expect(screen.queryByText(/pair new round!/i)).toBeNull();
        expect(screen.queryByText(/cut to\.\.\./i)).toBeNull();
      });

      it("the TO stage controls", () => {
        const stageDiv = document.getElementById("stage1");
        expect(stageDiv).not.toBeNull();
        if (!stageDiv) {
          return;
        }

        expect(stageDiv).not.toContainElement(
          queryByRole(stageDiv, "link", { name: /edit stage/i }),
        );
        expect(stageDiv).not.toContainElement(
          queryByRole(stageDiv, "button", { name: /delete stage/i }),
        );
      });

      it("the TO round controls", () => {
        const roundControlsDiv = screen.getByLabelText(/round controls/i);
        expect(roundControlsDiv).not.toContainElement(
          queryByRole(roundControlsDiv, "link", { name: /edit/i }),
        );
        expect(roundControlsDiv).not.toContainElement(
          queryByRole(roundControlsDiv, "button", { name: /complete/i }),
        );
        expect(roundControlsDiv).not.toContainElement(
          queryByRole(roundControlsDiv, "link", { name: /match slips/i }),
        );
        expect(roundControlsDiv).not.toContainElement(
          queryByRole(roundControlsDiv, "link", { name: /export markdown/i }),
        );
      });

      it("the TO pairing controls", () => {
        const table1Row = document.getElementsByClassName(
          "table_1",
        )[0] as HTMLElement;
        expect(table1Row).not.toContainElement(
          queryByRole(table1Row, "button", { name: /6-0/i }),
        );
        expect(table1Row).not.toContainElement(
          queryByRole(table1Row, "button", { name: /reports/i }),
        );
        expect(table1Row).not.toContainElement(
          within(table1Row).queryByRole("button", {
            name: /delete/i,
          }),
        );
      });

      it("the Report Pairing button when self-reporting is not enabled", () => {
        const table1Row = document.getElementsByClassName(
          "table_1",
        )[0] as HTMLElement;
        expect(
          queryByRole(table1Row, "button", { name: /report pairing/i }),
        ).toBeNull();
      });
    });

    describe("self-reporting enabled", () => {
      beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(MockPairing1.policy, "self_report", "get").mockReturnValue(
          true,
        );
      });

      describe.each([
        [MockSelfReportPlayer1Sweep, "6-0"],
        [MockSelfReportCorpSplit, "3-3 (C)"],
        [MockSelfReportRunnerSplit, "3-3 (R)"],
        [MockSelfReportPlayer2Sweep, "0-6"],
      ])(
        "using preset score",
        (scoreReport: ScoreReport, buttonText: string) => {
          it(scoreReport.label ?? "", async () => {
            const { rerender } = renderRounds();

            vi.spyOn(MockPairing1.policy, "self_report", "get").mockReturnValue(
              false,
            );
            vi.spyOn(MockPairing1, "self_reports", "get").mockReturnValue([
              scoreReport,
            ]);
            const table1Row = document.getElementsByClassName(
              "table_1",
            )[0] as HTMLElement;
            await user.click(
              getByRole(table1Row, "button", { name: /report pairing/i }),
            );

            const reportDialog = document.getElementById(`reportModal-${MockPairing1.id}`);
            expect(reportDialog).not.toBeNull();
            if (!reportDialog) {
              return;
            }
            await user.click(getByText(reportDialog, buttonText));

            await rerender({ data: structuredClone(MockPageData) });

            expect(reportScore).toHaveBeenCalledOnce();
            expect(
              queryByRole(table1Row, "button", { name: /report pairing/i }),
            ).toBeNull();
            expect(
              getByText(table1Row, `Report: ${scoreReport.label ?? ""}`),
            ).not.toBeNull();
          });
        },
      );
    });
  });
});
