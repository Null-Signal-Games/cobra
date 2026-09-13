/*
  Explanation of the rerender() function used throughout this file:

  render() returns a rerender() function which is useful for simulating changes
  to props. We rely on invalidateAll() to cause load() to be called again,
  changing the data prop, which in turn causes the props object's reactivity to
  kick in and rerender things. This is where rerender() comes into play for us.
  
  Additionally, Svelte seems not to register differences in the props if the
  props object's reference hasn't changed, so we are cloning it in the tests to
  ensure that it's always a new value (to Svelte).
*/

import {
  cleanup,
  getByRole,
  render,
  screen,
  within,
} from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  completeRound,
  createStage,
  deletePairing,
  pairRound,
  reportScore,
  setPlayerRegistrationStatus,
  setRegistrationStatus,
  updateRoundTimer,
} from "../../api_helper";
import RoundsPage from "./+page.svelte";
import type { PageProps } from "./$types";
import {
  MockSwissStage,
  MockRound1,
  MockPlayerAlice,
  MockPlayerBob,
  MockPairing1,
  MockRound1Timer,
  MockRound2,
  MockSingleElimCutStage,
  MockDoubleElimCutStage,
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
  player: MockPlayerAlice,
  policy: MockPolicy,
  stages: [MockSwissStage],
};

vi.mock("../../api_helper", () => ({
  loadPairings: vi.fn(),
  changePlayerSide: vi.fn(),
  createStage: vi.fn(),
  setRegistrationStatus: vi.fn(),
  setPlayerRegistrationStatus: vi.fn(),
  pairRound: vi.fn(),
  completeRound: vi.fn(),
  deletePairing: vi.fn(),
  updateRoundTimer: vi.fn(),
  reportScore: vi.fn(),
}));

vi.mock('$app/env/public', () => {
  return {
    COBRA_API_SERVER: "http://localhost:3000"
  };
});

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
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("as organizer", () => {
    describe("with no stages", () => {
      beforeEach(() => {
        vi.spyOn(MockPageData, "stages", "get").mockReturnValue([]);
      });
      
      it("has no cut links when no rounds have been completed", () => {
        renderRounds();

        expect(screen.queryByText(/add swiss stage/i)).not.toBeNull();
        expect(screen.queryByText(/cut to\.\.\./i)).toBeNull();
      });

      it("creates a new swiss stage", async () => {
        const { rerender } = renderRounds();

        expect(screen.queryByText(/^swiss$/i)).toBeNull();

        vi.spyOn(MockPageData, "stages", "get").mockReturnValue([
          MockSwissStage,
        ]);
        await user.click(
          screen.getByRole("button", { name: /add swiss stage/i }),
        );

        await rerender({ data: structuredClone(MockPageData) });

        expect(createStage).toHaveBeenCalledOnce();
        expect(screen.queryByText(/^swiss$/i)).not.toBeNull();
      });
    });

    describe("with no rounds", () => {
      beforeEach(() => {
        vi.spyOn(MockSwissStage, "rounds", "get").mockReturnValue([]);
      });

      describe("with registration open", () => {
        it("closes registration", async () => {
          const { rerender } = renderRounds();

          vi.spyOn(
            MockTournament,
            "registration_closed",
            "get",
          ).mockReturnValue(true);
          vi.spyOn(
            MockTournament,
            "all_players_unlocked",
            "get",
          ).mockReturnValue(false);
          vi.spyOn(
            MockTournament,
            "any_player_unlocked",
            "get",
          ).mockReturnValue(false);
          await user.click(
            screen.getByRole("button", { name: /close registration/i }),
          );

          await rerender({ data: structuredClone(MockPageData) });

          expect(setRegistrationStatus).toHaveBeenCalledOnce();
          expect(screen.queryByText(/open registration/i)).not.toBeNull();
          expect(screen.queryByText(/unlock all players/i)).not.toBeNull();
        });
      });

      describe("with registration closed", () => {
        beforeEach(() => {
          vi.spyOn(
            MockTournament,
            "registration_closed",
            "get",
          ).mockReturnValue(true);
        });

        describe("with all players unlocked", () => {
          it("locks player registration", async () => {
            const { rerender } = renderRounds();

            vi.spyOn(
              MockTournament,
              "all_players_unlocked",
              "get",
            ).mockReturnValue(false);
            vi.spyOn(
              MockTournament,
              "any_player_unlocked",
              "get",
            ).mockReturnValue(false);
            await user.click(
              screen.getByRole("button", { name: /lock all players/i }),
            );

            await rerender({ data: structuredClone(MockPageData) });

            expect(setPlayerRegistrationStatus).toHaveBeenCalledOnce();
            expect(screen.queryByText(/unlock all players/i)).not.toBeNull();
          });
        });

        describe("with all players locked", () => {
          beforeEach(() => {
            vi.spyOn(
              MockTournament,
              "all_players_unlocked",
              "get",
            ).mockReturnValue(false);
            vi.spyOn(
              MockTournament,
              "any_player_unlocked",
              "get",
            ).mockReturnValue(false);
          });
          
          it("opens registration", async () => {
            const { rerender } = renderRounds();
            
            vi.spyOn(
              MockTournament,
              "registration_closed",
              "get",
            ).mockReturnValue(false);
            await user.click(
              screen.getByRole("button", { name: /open registration/i }),
            );

            await rerender({ data: structuredClone(MockPageData) });

            expect(setRegistrationStatus).toHaveBeenCalledOnce();
            expect(screen.queryByText(/close registration/i)).not.toBeNull();
            expect(screen.queryByText(/lock all players/i)).toBeNull();
          });

          it("unlocks player registration", async () => {
            const { rerender } = renderRounds();

            vi.spyOn(
              MockTournament,
              "all_players_unlocked",
              "get",
            ).mockReturnValue(true);
            vi.spyOn(
              MockTournament,
              "any_player_unlocked",
              "get",
            ).mockReturnValue(true);
            await user.click(
              screen.getByRole("button", { name: /unlock all players/i }),
            );

            await rerender({ data: structuredClone(MockPageData) });

            expect(setPlayerRegistrationStatus).toHaveBeenCalledOnce();
            expect(screen.queryByText(/lock all players/i)).not.toBeNull();
          });
        });
      });
    });

    describe("with no completed rounds", () => {
      it("has no cut links when no rounds have been completed", () => {
        renderRounds();

        expect(screen.queryByText(/^swiss$/i)).not.toBeNull();
        expect(screen.queryByText(/cut to\.\.\./i)).toBeNull();
      });

      describe("complete round", () => {
        it("completes the round", async () => {
          const { rerender } = renderRounds();

          vi.spyOn(MockRound1, "completed", "get").mockReturnValue(true);
          vi.spyOn(window, "confirm").mockReturnValue(true);

          await user.click(screen.getByRole("button", { name: /complete/i }));

          await rerender({ data: structuredClone(MockPageData) });

          expect(completeRound).toHaveBeenCalledOnce();
          expect(
            screen.queryByRole("button", { name: /complete/i }),
          ).not.toBeInTheDocument();
        });

        it("does not complete the round if cancelled", async () => {
          renderRounds();

          vi.spyOn(window, "confirm").mockReturnValue(false);

          await user.click(screen.getByRole("button", { name: /complete/i }));

          expect(completeRound).not.toHaveBeenCalled();
          expect(
            screen.getByRole("button", { name: /complete/i }),
          ).toBeInTheDocument();
        });
      });

      it("deletes a pairing", async () => {
        const { rerender } = renderRounds();

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

        await rerender({ data: structuredClone(MockPageData) });

        expect(deletePairing).toHaveBeenCalledOnce();
        expect(table1Row).not.toBeInTheDocument();
      });

      it("does not delete a pairing if cancelled", async () => {
        renderRounds();

        vi.spyOn(window, "confirm").mockReturnValue(false);

        const table1Row = document.getElementsByClassName(
          "table_1",
        )[0] as HTMLElement;
        await user.click(
          within(table1Row).getByRole("button", { name: /delete/i }),
        );
        expect(deletePairing).not.toHaveBeenCalled();
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
            const { rerender } = renderRounds();

            vi.spyOn(MockPairing1, "reported", "get").mockReturnValue(true);
            vi.spyOn(MockPairing1, "score1", "get").mockReturnValue(score1);
            vi.spyOn(MockPairing1, "score2", "get").mockReturnValue(score2);

            const table1Row = document.getElementsByClassName(
              "table_1",
            )[0] as HTMLElement;
            await user.click(
              within(table1Row).getByRole("button", { name: buttonText }),
            );

            await rerender({ data: structuredClone(MockPageData) });

            expect(reportScore).toHaveBeenCalledOnce();
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
          const { rerender } = renderRounds();

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

          await rerender({ data: structuredClone(MockPageData) });

          expect(reportScore).toHaveBeenCalledOnce();
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

      it("does not show the Report Pairing button", () => {
        renderRounds();

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
        renderRounds();

        const roundTimerForm = document.getElementsByClassName(
          "round-timer-form",
        )[0] as HTMLElement;

        await user.click(
          getByRole(roundTimerForm, "button", { name: /start/i }),
        );

        expect(updateRoundTimer).toHaveBeenCalledWith("", 1, 1, 65, "start");
      });

      it("resets the round timer", async () => {
        renderRounds();

        vi.spyOn(window, "confirm").mockReturnValue(true);
        const roundTimerForm = document.getElementsByClassName(
          "round-timer-form",
        )[0] as HTMLElement;

        await user.click(
          getByRole(roundTimerForm, "button", { name: /reset/i }),
        );

        expect(updateRoundTimer).toHaveBeenCalledWith("", 1, 1, 65, "reset");
      });
    });

    describe("with the round timer started", () => {
      beforeEach(() => {
        vi.spyOn(MockRound1Timer, "running", "get").mockReturnValue(true);

        renderRounds();
      });

      it("pauses the round timer", async () => {
        const roundTimerForm = document.getElementsByClassName(
          "round-timer-form",
        )[0] as HTMLElement;

        await user.click(
          getByRole(roundTimerForm, "button", { name: /pause/i }),
        );

        expect(updateRoundTimer).toHaveBeenCalledWith("", 1, 1, 65, "stop");
      });
    });

    describe("with the round timer paused", () => {
      beforeEach(() => {
        vi.spyOn(MockRound1Timer, "started", "get").mockReturnValue(true);
        vi.spyOn(MockRound1Timer, "paused", "get").mockReturnValue(true);

        renderRounds();
      });

      it("pauses the round timer", async () => {
        const roundTimerForm = document.getElementsByClassName(
          "round-timer-form",
        )[0] as HTMLElement;

        await user.click(
          getByRole(roundTimerForm, "button", { name: /resume/i }),
        );

        expect(updateRoundTimer).toHaveBeenCalledWith("", 1, 1, 65, "start");
      });
    });

    describe("with one round completed", () => {
      beforeEach(() => {
        vi.spyOn(MockRound1, "completed", "get").mockReturnValue(true);
      });

      it("pairs a new round", async () => {
        const { rerender } = renderRounds();

        expect(screen.queryByText(/round 2/i)).toBeNull();

        vi.spyOn(MockSwissStage, "rounds", "get").mockReturnValue([
          MockRound1,
          MockRound2,
        ]);
        vi.spyOn(window, "confirm").mockReturnValue(true);

        await user.click(
          screen.getByRole("button", { name: /pair new round!/i }),
        );

        await rerender({ data: structuredClone(MockPageData) });

        expect(pairRound).toHaveBeenCalledOnce();
        expect(screen.queryByText(/round 2/i)).not.toBeNull();
      });

      it("shows cut buttons and allows creating single elim stage", async () => {
        const { rerender } = renderRounds();

        expect(screen.queryByText(/^single elim$/i)).toBeNull();

        vi.spyOn(MockPageData, "stages", "get").mockReturnValue([
          MockSwissStage,
          MockSingleElimCutStage,
        ]);
        await user.click(
          screen.getByRole("button", {
            name: /cut to single elimination top 3/i,
          }),
        );

        await rerender({ data: structuredClone(MockPageData) });

        expect(createStage).toHaveBeenCalledOnce();
        expect(screen.queryByText(/^single elim$/i)).not.toBeNull();
      });

      it("shows cut buttons and allows creating double elim stage", async () => {
        const { rerender } = renderRounds();

        expect(screen.queryByText(/^double elim$/i)).toBeNull();

        vi.spyOn(MockPageData, "stages", "get").mockReturnValue([
          MockSwissStage,
          MockDoubleElimCutStage,
        ]);
        await user.click(
          screen.getByRole("button", {
            name: /cut to double elimination top 4/i,
          }),
        );

        await rerender({ data: structuredClone(MockPageData) });

        expect(createStage).toHaveBeenCalledOnce();
        expect(screen.queryByText(/^double elim$/i)).not.toBeNull();
      });
    });
  });
});
