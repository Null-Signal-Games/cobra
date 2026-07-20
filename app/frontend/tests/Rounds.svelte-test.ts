import {
  getByRole,
  getByText,
  queryByRole,
  render,
  screen,
  within,
} from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  completeRound,
  createStage,
  deletePairing,
  deleteStage,
  loadPairings,
  pairRound,
  setPlayerRegistrationStatus,
  setRegistrationStatus,
  updateRoundTimer,
} from "../pairings/PairingsData";
import Rounds from "../pairings/Rounds.svelte";
import { reportScore, type ScoreReport } from "../pairings/SelfReport";
import {
  MockDoubleElimCutStage,
  MockPairing1,
  MockPairingsData,
  MockPlayerAlice,
  MockPlayerBob,
  MockRound1,
  MockRound1Timer,
  MockRound2,
  MockSelfReportCorpSplit,
  MockSelfReportPlayer1Sweep,
  MockSelfReportPlayer2Sweep,
  MockSelfReportRunnerSplit,
  MockSingleElimCutStage,
  MockSwissStage,
} from "./RoundsTestData";

const user = userEvent.setup();

vi.mock("../pairings/PairingsData", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../pairings/PairingsData")>()),
  loadPairings: vi.fn(() => MockPairingsData),
  createStage: vi.fn(() => true),
  deleteStage: vi.fn(() => true),
  setRegistrationStatus: vi.fn(() => true),
  setPlayerRegistrationStatus: vi.fn(() => true),
  pairRound: vi.fn(() => true),
  completeRound: vi.fn(() => true),
  deletePairing: vi.fn(() => true),
  updateRoundTimer: vi.fn(() => true),
}));

vi.mock("../pairings/SelfReport", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../pairings/SelfReport")>()),
  reportScore: vi.fn(() => true),
}));

describe("Rounds", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("as organizer", () => {
    describe("with no stages", () => {
      beforeEach(() => {
        vi.spyOn(MockPairingsData, "stages", "get").mockReturnValue([]);

        render(Rounds, { tournamentId: 1 });
      });

      it("creates a new swiss stage", async () => {
        expect(screen.queryByText(/^swiss$/i)).toBeNull();

        vi.spyOn(MockPairingsData, "stages", "get").mockReturnValue([
          MockSwissStage,
        ]);
        await user.click(
          screen.getByRole("button", { name: /add swiss stage/i }),
        );

        expect(createStage).toHaveBeenCalledOnce();
        expect(loadPairings).toHaveBeenCalledTimes(2);
        expect(screen.queryByText(/^swiss$/i)).not.toBeNull();
      });
    });

    describe("with no rounds", () => {
      beforeEach(() => {
        vi.spyOn(MockSwissStage, "rounds", "get").mockReturnValue([]);
      });

      describe("with registration open", () => {
        beforeEach(() => {
          render(Rounds, { tournamentId: 1 });
        });

        it("closes registration", async () => {
          vi.spyOn(
            MockPairingsData.tournament,
            "registration_closed",
            "get",
          ).mockReturnValue(true);
          vi.spyOn(
            MockPairingsData.tournament,
            "all_players_unlocked",
            "get",
          ).mockReturnValue(false);
          vi.spyOn(
            MockPairingsData.tournament,
            "any_player_unlocked",
            "get",
          ).mockReturnValue(false);
          await user.click(
            screen.getByRole("button", { name: /close registration/i }),
          );

          expect(setRegistrationStatus).toHaveBeenCalledOnce();
          expect(loadPairings).toHaveBeenCalledTimes(2);
          expect(screen.queryByText(/open registration/i)).not.toBeNull();
          expect(screen.queryByText(/unlock all players/i)).not.toBeNull();
        });
      });

      describe("with registration closed", () => {
        beforeEach(() => {
          vi.spyOn(
            MockPairingsData.tournament,
            "registration_closed",
            "get",
          ).mockReturnValue(true);
        });

        describe("with all players unlocked", () => {
          beforeEach(() => {
            render(Rounds, { tournamentId: 1 });
          });

          it("locks player registration", async () => {
            vi.spyOn(
              MockPairingsData.tournament,
              "all_players_unlocked",
              "get",
            ).mockReturnValue(false);
            vi.spyOn(
              MockPairingsData.tournament,
              "any_player_unlocked",
              "get",
            ).mockReturnValue(false);
            await user.click(
              screen.getByRole("button", { name: /lock all players/i }),
            );

            expect(setPlayerRegistrationStatus).toHaveBeenCalledOnce();
            expect(loadPairings).toHaveBeenCalledTimes(2);
            expect(screen.queryByText(/unlock all players/i)).not.toBeNull();
          });
        });

        describe("with all players locked", () => {
          beforeEach(() => {
            vi.spyOn(
              MockPairingsData.tournament,
              "all_players_unlocked",
              "get",
            ).mockReturnValue(false);
            vi.spyOn(
              MockPairingsData.tournament,
              "any_player_unlocked",
              "get",
            ).mockReturnValue(false);
            render(Rounds, { tournamentId: 1 });
          });

          it("opens registration", async () => {
            vi.spyOn(
              MockPairingsData.tournament,
              "registration_closed",
              "get",
            ).mockReturnValue(false);
            await user.click(
              screen.getByRole("button", { name: /open registration/i }),
            );

            expect(setRegistrationStatus).toHaveBeenCalledOnce();
            expect(loadPairings).toHaveBeenCalledTimes(2);
            expect(screen.queryByText(/close registration/i)).not.toBeNull();
            expect(screen.queryByText(/lock all players/i)).toBeNull();
          });

          it("unlocks player registration", async () => {
            vi.spyOn(
              MockPairingsData.tournament,
              "all_players_unlocked",
              "get",
            ).mockReturnValue(true);
            vi.spyOn(
              MockPairingsData.tournament,
              "any_player_unlocked",
              "get",
            ).mockReturnValue(true);
            await user.click(
              screen.getByRole("button", { name: /unlock all players/i }),
            );

            expect(setPlayerRegistrationStatus).toHaveBeenCalledOnce();
            expect(loadPairings).toHaveBeenCalledTimes(2);
            expect(screen.queryByText(/lock all players/i)).not.toBeNull();
          });
        });
      });
    });

    describe("with no completed rounds", () => {
      beforeEach(() => {
        render(Rounds, { tournamentId: 1 });
      });

      describe("complete round", () => {
        it("completes the round", async () => {
          vi.spyOn(MockRound1, "completed", "get").mockReturnValue(true);
          vi.spyOn(window, "confirm").mockReturnValue(true);

          await user.click(screen.getByRole("button", { name: /complete/i }));

          expect(completeRound).toHaveBeenCalledOnce();
          expect(loadPairings).toHaveBeenCalledTimes(2);
          expect(
            screen.queryByRole("button", { name: /complete/i }),
          ).not.toBeInTheDocument();
        });

        it("does not complete the round if cancelled", async () => {
          vi.spyOn(window, "confirm").mockReturnValue(false);

          await user.click(screen.getByRole("button", { name: /complete/i }));

          expect(completeRound).not.toHaveBeenCalled();
          expect(loadPairings).toHaveBeenCalledOnce();
          expect(
            screen.getByRole("button", { name: /complete/i }),
          ).toBeInTheDocument();
        });
      });

      it("deletes a pairing", async () => {
        vi.spyOn(MockRound1, "pairings", "get").mockReturnValue([]);
        vi.spyOn(MockRound1, "unpaired_players", "get").mockReturnValue([
          MockPlayerAlice,
          MockPlayerBob,
        ]);
        vi.spyOn(window, "confirm").mockReturnValue(true);

        const table1Row = document.getElementsByClassName(
          "table_1",
        )[0] as HTMLElement;
        await user.click(
          within(table1Row).getByRole("button", { name: /delete/i }),
        );
        expect(deletePairing).toHaveBeenCalledOnce();
        expect(loadPairings).toHaveBeenCalledTimes(2);
        expect(table1Row).not.toBeInTheDocument();
      });

      it("does not delete a pairing if cancelled", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(false);

        const table1Row = document.getElementsByClassName(
          "table_1",
        )[0] as HTMLElement;
        await user.click(
          within(table1Row).getByRole("button", { name: /delete/i }),
        );
        expect(deletePairing).not.toHaveBeenCalled();
        expect(loadPairings).toHaveBeenCalledOnce();
        expect(table1Row).toBeInTheDocument();
      });

      describe.each([
        [6, 0, false, false, /6-0/i, "6 - 0"],
        [3, 3, false, false, /3-3 \(c\)/i, "3 - 3 (c)"],
        [3, 3, false, false, /3-3 \(r\)/i, "3 - 3 (R)"],
        [6, 0, false, false, /0-6/i, "0 - 6"],
      ])(
        "using preset score",
        (score1, score2, id, twoForOne, buttonText, scoreText) => {
          it(scoreText, async () => {
            vi.spyOn(MockPairing1, "reported", "get").mockReturnValue(true);
            vi.spyOn(MockPairing1, "score1", "get").mockReturnValue(score1);
            vi.spyOn(MockPairing1, "score2", "get").mockReturnValue(score2);

            const table1Row = document.getElementsByClassName(
              "table_1",
            )[0] as HTMLElement;
            await user.click(
              within(table1Row).getByRole("button", { name: buttonText }),
            );

            expect(reportScore).toHaveBeenCalledOnce();
            expect(loadPairings).toHaveBeenCalledTimes(2);
            expect(
              within(table1Row).getByRole("textbox", { name: /corp-score/i }),
            ).toHaveValue(score1.toString());
            expect(
              within(table1Row).getByRole("textbox", { name: /runner-score/i }),
            ).toHaveValue(score2.toString());
            if (id) {
              expect(
                within(table1Row).getByRole("checkbox", {
                  name: /intentional draw/i,
                }),
              ).toBeChecked();
            } else {
              expect(
                within(table1Row).getByRole("checkbox", {
                  name: /intentional draw/i,
                }),
              ).not.toBeChecked();
            }
            if (twoForOne) {
              expect(
                within(table1Row).getByRole("checkbox", { name: /2 for 1/i }),
              ).toBeChecked();
            } else {
              expect(
                within(table1Row).getByRole("checkbox", { name: /2 for 1/i }),
              ).not.toBeChecked();
            }
          });
        },
      );

      describe.each([
        [1, 2, false, false, "saves a custom score"],
        [3, 3, true, false, "saves an intentional draw"],
        [6, 0, false, true, "saves a 2 for 1"],
      ])("using custom score", (score1, score2, id, twoForOne, testName) => {
        it(testName, async () => {
          vi.spyOn(MockPairing1, "reported", "get").mockReturnValue(true);
          vi.spyOn(MockPairing1, "score1", "get").mockReturnValue(score1);
          vi.spyOn(MockPairing1, "score2", "get").mockReturnValue(score2);
          vi.spyOn(MockPairing1, "intentional_draw", "get").mockReturnValue(id);
          vi.spyOn(MockPairing1, "two_for_one", "get").mockReturnValue(
            twoForOne,
          );

          const table1Row = document.getElementsByClassName(
            "table_1",
          )[0] as HTMLElement;
          await user.click(
            within(table1Row).getByRole("button", { name: /show-custom/i }),
          );
          await user.type(
            within(table1Row).getByRole("textbox", { name: /corp-score/i }),
            score1.toString(),
          );
          await user.type(
            within(table1Row).getByRole("textbox", { name: /runner-score/i }),
            score2.toString(),
          );
          if (id) {
            await user.click(
              within(table1Row).getByRole("checkbox", {
                name: /intentional draw/i,
              }),
            );
          }
          if (twoForOne) {
            await user.click(
              within(table1Row).getByRole("checkbox", {
                name: /2 for 1/i,
              }),
            );
          }
          await user.click(
            within(table1Row).getByRole("button", { name: /save/i }),
          );

          expect(reportScore).toHaveBeenCalledOnce();
          expect(loadPairings).toHaveBeenCalledTimes(2);
          expect(
            within(table1Row).getByRole("textbox", { name: /corp-score/i }),
          ).toHaveValue(score1.toString());
          expect(
            within(table1Row).getByRole("textbox", { name: /runner-score/i }),
          ).toHaveValue(score2.toString());
          if (id) {
            expect(
              within(table1Row).getByRole("checkbox", {
                name: /intentional draw/i,
              }),
            ).toBeChecked();
          } else {
            expect(
              within(table1Row).getByRole("checkbox", {
                name: /intentional draw/i,
              }),
            ).not.toBeChecked();
          }
          if (twoForOne) {
            expect(
              within(table1Row).getByRole("checkbox", { name: /2 for 1/i }),
            ).toBeChecked();
          } else {
            expect(
              within(table1Row).getByRole("checkbox", { name: /2 for 1/i }),
            ).not.toBeChecked();
          }
        });
      });

      it("deletes a stage", async () => {
        const stageDiv = document.getElementById("stage1");
        expect(stageDiv).not.toBeNull();
        if (!stageDiv) {
          return;
        }

        vi.spyOn(MockPairingsData, "stages", "get").mockReturnValue([]);
        vi.spyOn(window, "confirm").mockReturnValue(true);
        await user.click(
          getByRole(stageDiv, "button", { name: /delete stage/i }),
        );

        expect(deleteStage).toHaveBeenCalledOnce();
        expect(loadPairings).toHaveBeenCalledTimes(2);
        expect(stageDiv).not.toBeInTheDocument();
      });

      it("does not show the Report Pairing button", () => {
        const table1Row = document.getElementsByClassName(
          "table_1",
        )[0] as HTMLElement;
        expect(table1Row).not.toContainElement(
          within(table1Row).queryByRole("button", {
            name: /report pairing/i,
          }),
        );
      });

      it("starts the round timer", async () => {
        const roundTimerForm = document.getElementsByClassName(
          "round-timer-form",
        )[0] as HTMLElement;

        const mockLocation = { href: "" };
        Object.defineProperty(window, "location", {
          value: mockLocation,
          writable: true,
        });

        await user.click(
          getByRole(roundTimerForm, "button", { name: /start/i }),
        );

        expect(updateRoundTimer).toHaveBeenCalledWith(1, 1, 65, "start");
        expect(mockLocation.href).toBe("/beta/tournaments/1/rounds");
      });

      it("resets the round timer", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);
        const roundTimerForm = document.getElementsByClassName(
          "round-timer-form",
        )[0] as HTMLElement;

        const mockLocation = { href: "" };
        Object.defineProperty(window, "location", {
          value: mockLocation,
          writable: true,
        });

        await user.click(
          getByRole(roundTimerForm, "button", { name: /reset/i }),
        );

        expect(updateRoundTimer).toHaveBeenCalledWith(1, 1, 65, "reset");
        expect(mockLocation.href).toBe("/beta/tournaments/1/rounds");
      });
    });

    describe("with the round timer started", () => {
      beforeEach(() => {
        vi.spyOn(MockRound1Timer, "running", "get").mockReturnValue(true);

        render(Rounds, { tournamentId: 1 });
      });

      it("pauses the round timer", async () => {
        const roundTimerForm = document.getElementsByClassName(
          "round-timer-form",
        )[0] as HTMLElement;

        const mockLocation = { href: "" };
        Object.defineProperty(window, "location", {
          value: mockLocation,
          writable: true,
        });

        await user.click(
          getByRole(roundTimerForm, "button", { name: /pause/i }),
        );

        expect(updateRoundTimer).toHaveBeenCalledWith(1, 1, 65, "stop");
        expect(mockLocation.href).toBe("/beta/tournaments/1/rounds");
      });
    });

    describe("with the round timer paused", () => {
      beforeEach(() => {
        vi.spyOn(MockRound1Timer, "started", "get").mockReturnValue(true);
        vi.spyOn(MockRound1Timer, "paused", "get").mockReturnValue(true);

        render(Rounds, { tournamentId: 1 });
      });

      it("pauses the round timer", async () => {
        const roundTimerForm = document.getElementsByClassName(
          "round-timer-form",
        )[0] as HTMLElement;

        const mockLocation = { href: "" };
        Object.defineProperty(window, "location", {
          value: mockLocation,
          writable: true,
        });

        await user.click(
          getByRole(roundTimerForm, "button", { name: /resume/i }),
        );

        expect(updateRoundTimer).toHaveBeenCalledWith(1, 1, 65, "start");
        expect(mockLocation.href).toBe("/beta/tournaments/1/rounds");
      });
    });

    describe("with one round completed", () => {
      beforeEach(() => {
        vi.spyOn(MockRound1, "completed", "get").mockReturnValue(true);

        render(Rounds, { tournamentId: 1 });
      });

      it("pairs a new round", async () => {
        expect(screen.queryByText(/round 2/i)).toBeNull();

        vi.spyOn(MockPairingsData.stages[0], "rounds", "get").mockReturnValue([
          MockRound1,
          MockRound2,
        ]);
        vi.spyOn(window, "confirm").mockReturnValue(true);

        await user.click(
          screen.getByRole("button", { name: /pair new round!/i }),
        );

        expect(pairRound).toHaveBeenCalledOnce();
        expect(loadPairings).toHaveBeenCalledTimes(2);
        expect(screen.queryByText(/round 2/i)).not.toBeNull();
      });

      it("creates a single elim cut stage", async () => {
        expect(screen.queryByText(/^single elim$/i)).toBeNull();

        vi.spyOn(MockPairingsData, "stages", "get").mockReturnValue([
          MockSwissStage,
          MockSingleElimCutStage,
        ]);
        await user.click(
          screen.getByRole("button", {
            name: /cut to single elimination top 3/i,
          }),
        );

        expect(createStage).toHaveBeenCalledOnce();
        expect(loadPairings).toHaveBeenCalledTimes(2);
        expect(screen.queryByText(/^single elim$/i)).not.toBeNull();
      });

      it("creates a double elim cut stage", async () => {
        expect(screen.queryByText(/^double elim$/i)).toBeNull();

        vi.spyOn(MockPairingsData, "stages", "get").mockReturnValue([
          MockSwissStage,
          MockDoubleElimCutStage,
        ]);
        await user.click(
          screen.getByRole("button", {
            name: /cut to double elimination top 4/i,
          }),
        );

        expect(createStage).toHaveBeenCalledOnce();
        expect(loadPairings).toHaveBeenCalledTimes(2);
        expect(screen.queryByText(/^double elim$/i)).not.toBeNull();
      });
    });
  });

  describe("as player", () => {
    beforeEach(() => {
      vi.spyOn(MockPairingsData.policy, "update", "get").mockReturnValue(false);
    });

    describe("does not show", () => {
      beforeEach(() => {
        render(Rounds, { tournamentId: 1 });
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
        vi.spyOn(MockPairing1.policy, "self_report", "get").mockReturnValue(
          true,
        );

        render(Rounds, { tournamentId: 1 });
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

            expect(reportScore).toHaveBeenCalledOnce();
            expect(loadPairings).toHaveBeenCalledTimes(2);
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
