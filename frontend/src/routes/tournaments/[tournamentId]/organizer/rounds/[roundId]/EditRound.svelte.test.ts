import {
  cleanup,
  getByRole,
  getByText,
  queryByTestId,
  queryByText,
  render,
  screen,
  within,
} from "@testing-library/svelte";
import { userEvent } from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import EditRound from "./+page.svelte";
import {
  MockPlayerAlice,
  MockPlayerBob,
  MockRound1Timer,
  MockRoundData,
  MockSelfReport2,
  Pairing1,
} from "./EditRoundTestData";
import {
  changePlayerSide,
  completeRound,
  createPairing,
  deletePairing,
  deleteRound,
  rePairRound,
  reportScore,
  resetReports,
} from "../../../api_helper";
import type { PageProps } from "./$types";
import { Tournament } from "$lib/model/Tournament";
import { goto } from "$app/navigation";

export const MockPageData: PageProps["data"] = {
  tournamentTypes: [],
  policy: { update: true, custom_table_numbering: false },
  stage: {
    id: 1,
    name: "Single Sided Swiss",
    format: "single_sided_swiss",
    is_single_sided: true,
    is_elimination: false,
    view_decks: false,
    rounds: [],
  },
  round: {
    id: 1,
    number: 1,
    completed: false,
    weight: 1.0,
    pairings: [Pairing1],
    pairings_reported: 0,
    length_minutes: 0,
    timer: MockRound1Timer,
    unpaired_players: [],
  },
  tournamentData: {
    tournament: new Tournament(),
    csrf_token: ""
  },
  timer: MockRound1Timer,
  player: null
};

vi.mock("../../../api_helper", () => ({
  loadRound: vi.fn(() => MockRoundData),
  rePairRound: vi.fn(() => true),
  completeRound: vi.fn(() => true),
  deleteRound: vi.fn(() => true),
  createPairing: vi.fn(() => true),
  deletePairing: vi.fn(() => true),
  changePlayerSide: vi.fn(() => true),
  reportScore: vi.fn(() => true),
  resetReports: vi.fn(() => true),
  saveSOSWeighting: vi.fn(() => true),
}));

vi.mock("$app/navigation", async () => {
  return {
    ...await vi.importActual("$app/navigation"),
    goto: vi.fn(() => true),
  };
});

const user = userEvent.setup();

describe("EditRound", () => {
  function renderEditRound() {
    const props = {
      params: {
        tournamentId: MockRoundData.tournament.id.toString(),
        roundId: MockRoundData.round.id.toString(),
      },
      data: MockPageData,
    };

    return render(EditRound, { props: props });
  }

  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("re-pair", () => {
    beforeEach(() => {
      renderEditRound();
    });

    it("re-pairs the round", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);

      await user.click(screen.getByRole("button", { name: /re-pair/i }));

      expect(rePairRound).toHaveBeenCalledOnce();
    });

    it("does not re-pair the round if cancelled", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);

      await user.click(screen.getByRole("button", { name: /re-pair/i }));

      expect(rePairRound).not.toHaveBeenCalled();
    });
  });

  describe("complete", () => {
    it("completes the round", async () => {
      const { rerender } = renderEditRound();
      vi.spyOn(MockPageData.round, "completed", "get").mockReturnValue(true);
      vi.spyOn(window, "confirm").mockReturnValue(true);

      await user.click(screen.getByRole("button", { name: /complete/i }));

      await rerender({ data: structuredClone(MockPageData) });

      expect(completeRound).toHaveBeenCalledOnce();
      expect(
        screen.getByRole("button", { name: /uncomplete/i }),
      ).toBeInTheDocument();
    });

    it("does not complete the round if cancelled", async () => {
      renderEditRound();

      vi.spyOn(window, "confirm").mockReturnValue(false);

      await user.click(screen.getByRole("button", { name: /complete/i }));

      expect(completeRound).not.toHaveBeenCalled();
      expect(
        screen.queryByRole("button", { name: /uncomplete/i }),
      ).not.toBeInTheDocument();
    });
  });

  describe("delete round", () => {
    beforeEach(() => {
      renderEditRound();
    });

    it("deletes the round", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);

      await user.click(screen.getByRole("button", { name: /delete round/i }));

      expect(deleteRound).toHaveBeenCalledOnce();
      expect(goto).toHaveBeenCalledExactlyOnceWith("/tournaments/0/organizer/rounds");
    });

    it("does not delete the round if cancelled", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);

      await user.click(screen.getByRole("button", { name: /delete round/i }));

      expect(deleteRound).not.toHaveBeenCalled();
    });
  });

  describe("create pairing", () => {
    beforeEach(() => {
      vi.spyOn(MockPageData.round, "pairings", "get").mockReturnValue([]);
      vi.spyOn(MockPageData.round, "unpaired_players", "get").mockReturnValue([
        MockPlayerAlice,
        MockPlayerBob,
      ]);
    });

    it("creates a pairing", async () => {
      const { rerender } = renderEditRound();

      expect(document.getElementsByClassName("table_1").length).toBe(0);

      vi.spyOn(Pairing1, "table_number", "get").mockReturnValue(11);
      vi.spyOn(MockPageData.round, "pairings", "get").mockReturnValue([
        Pairing1,
      ]);
      vi.spyOn(MockPageData.round, "unpaired_players", "get").mockReturnValue(
        [],
      );

      const newPairingForm = document.getElementById("new_pairing");
      expect(newPairingForm).not.toBeNull();
      if (!newPairingForm) {
        return;
      }

      await user.type(
        getByRole(newPairingForm, "spinbutton", {
          name: /new pairing table number/i,
        }),
        "11",
      );
      await user.selectOptions(
        getByRole(newPairingForm, "combobox", {
          name: /^new pairing player 1$/i,
        }),
        "Alice",
      );
      await user.selectOptions(
        getByRole(newPairingForm, "combobox", {
          name: /new pairing player 1 side/i,
        }),
        "Corp",
      );
      await user.selectOptions(
        getByRole(newPairingForm, "combobox", {
          name: /^new pairing player 2$/i,
        }),
        "Bob",
      );
      await user.click(
        getByRole(newPairingForm, "button", { name: /create/i }),
      );

      await rerender({ data: structuredClone(MockPageData) });

      expect(createPairing).toHaveBeenCalledOnce();
      expect(
        document.getElementsByClassName("table_11")[0],
      ).toBeInTheDocument();
    });
  });

  describe("delete pairings", () => {
    it("deletes a pairing", async () => {
      const { rerender } = renderEditRound();

      vi.spyOn(MockPageData.round, "pairings", "get").mockReturnValue([]);
      vi.spyOn(MockPageData.round, "unpaired_players", "get").mockReturnValue([
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
      renderEditRound();

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
  });

  describe("player side", () => {
    it("changes player side", async () => {
      const { rerender } = renderEditRound();
      vi.spyOn(MockPlayerAlice, "side", "get").mockReturnValue("runner");
      vi.spyOn(MockPlayerBob, "side", "get").mockReturnValue("corp");
      vi.spyOn(window, "confirm").mockReturnValue(true);

      const table1Row = document.getElementsByClassName(
        "table_1",
      )[0] as HTMLElement;
      const aliceRunnerButton = getByRole(table1Row, "button", {
        name: /change alice to runner/i,
      });

      expect(aliceRunnerButton).not.toContainElement(
        queryByTestId(aliceRunnerButton, "selected"),
      );

      await user.click(aliceRunnerButton);

      await rerender({ data: structuredClone(MockPageData) });

      expect(changePlayerSide).toHaveBeenCalled();

      const aliceRunnerButton2 = getByRole(table1Row, "button", {
        name: /change alice to runner/i,
      });
      expect(aliceRunnerButton2).toContainElement(
        queryByTestId(aliceRunnerButton2, "selected"),
      );
    });
  });

  describe.each([
    [3, 0, "Corp Win"],
    [3, 3, "Tie"],
    [3, 3, "Intentional Draw"],
    [6, 0, "Runner Win"],
  ])("using preset score", (score1, score2, buttonText) => {
    it(buttonText, async () => {
      const { rerender } = renderEditRound();

      vi.spyOn(Pairing1, "reported", "get").mockReturnValue(true);
      vi.spyOn(Pairing1, "score1", "get").mockReturnValue(score1);
      vi.spyOn(Pairing1, "score2", "get").mockReturnValue(score2);

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
      expect(
        within(table1Row).getByRole("checkbox", {
          name: /intentional draw/i,
        }),
      ).not.toBeChecked();
    });
  });

  describe("using custom scores", () => {
    it("saves a custom score", async () => {
      const { rerender } = renderEditRound();

      vi.spyOn(Pairing1, "reported", "get").mockReturnValue(true);
      vi.spyOn(Pairing1, "score1", "get").mockReturnValue(1);
      vi.spyOn(Pairing1, "score2", "get").mockReturnValue(2);

      const table1Row = document.getElementsByClassName(
        "table_1",
      )[0] as HTMLElement;
      await user.click(
        within(table1Row).getByRole("button", { name: /show-custom/i }),
      );
      await user.type(
        within(table1Row).getByRole("textbox", { name: /corp-score/i }),
        "1",
      );
      await user.type(
        within(table1Row).getByRole("textbox", { name: /runner-score/i }),
        "2",
      );
      await user.click(
        within(table1Row).getByRole("button", { name: /save/i }),
      );

      await rerender({ data: structuredClone(MockPageData) });

      expect(reportScore).toHaveBeenCalledOnce();
      expect(
        within(table1Row).getByRole("textbox", { name: /corp-score/i }),
      ).toHaveValue("1");
      expect(
        within(table1Row).getByRole("textbox", { name: /runner-score/i }),
      ).toHaveValue("2");
      expect(
        within(table1Row).getByRole("checkbox", {
          name: /intentional draw/i,
        }),
      ).not.toBeChecked();
    });

    it("saves an intentional draw", async () => {
      const { rerender } = renderEditRound();
      vi.spyOn(
        MockRoundData.round.pairings[0],
        "reported",
        "get",
      ).mockReturnValue(true);
      vi.spyOn(
        MockRoundData.round.pairings[0],
        "intentional_draw",
        "get",
      ).mockReturnValue(true);

      const table1Row = document.getElementsByClassName(
        "table_1",
      )[0] as HTMLElement;
      await user.click(
        within(table1Row).getByRole("button", { name: /show-custom/i }),
      );
      await user.click(
        within(table1Row).getByRole("checkbox", {
          name: /intentional draw/i,
        }),
      );
      await user.click(
        within(table1Row).getByRole("button", { name: /save/i }),
      );

      await rerender({ data: structuredClone(MockPageData) });

      expect(reportScore).toHaveBeenCalledOnce();
      expect(
        within(table1Row).getByRole("checkbox", {
          name: /intentional draw/i,
        }),
      ).toBeChecked();
    });
  });

  describe("manage self-reports", () => {
    describe("when self-reports agree", () => {
      it("accepts a report", async () => {
        const { rerender } = renderEditRound();
        const table1Row = document.getElementsByClassName(
          "table_1",
        )[0] as HTMLElement;

        const reportsButton = within(table1Row).getByRole("button", {
          name: /reports/i,
        });
        expect(reportsButton).not.toContainElement(
          queryByTestId(reportsButton, "reportConflict"),
        );

        await user.click(reportsButton);

        const reportDialog = document.getElementById("reports1");
        expect(reportDialog).not.toBeNull();
        if (!reportDialog) {
          return;
        }
        const aliceAcceptButton = getByText(reportDialog, /accept alice/i);
        expect(reportDialog).toContainElement(
          getByText(reportDialog, /alice reported: 6 - 0/i),
        );
        expect(reportDialog).toContainElement(
          getByText(reportDialog, /bob reported: 6 - 0/i),
        );
        expect(reportDialog).toContainElement(aliceAcceptButton);
        expect(reportDialog).toContainElement(
          queryByText(reportDialog, /accept bob/i),
        );

        vi.spyOn(Pairing1, "reported", "get").mockReturnValue(true);
        vi.spyOn(Pairing1, "score1", "get").mockReturnValue(6);
        vi.spyOn(Pairing1, "score2", "get").mockReturnValue(0);
        await user.click(aliceAcceptButton);

        await rerender({ data: structuredClone(MockPageData) });

        expect(reportScore).toHaveBeenCalledOnce();
        expect(
          within(table1Row).getByRole("textbox", { name: /corp-score/i }),
        ).toHaveValue("6");
        expect(
          within(table1Row).getByRole("textbox", { name: /runner-score/i }),
        ).toHaveValue("0");
        expect(
          within(table1Row).getByRole("checkbox", {
            name: /intentional draw/i,
          }),
        ).not.toBeChecked();
      });
    });

    describe("when self-reports disagree", () => {
      beforeEach(() => {
        vi.spyOn(MockSelfReport2, "score1", "get").mockReturnValue(0);
        vi.spyOn(MockSelfReport2, "score2", "get").mockReturnValue(6);
        vi.spyOn(MockSelfReport2, "score1_corp", "get").mockReturnValue(0);
        vi.spyOn(MockSelfReport2, "score1_runner", "get").mockReturnValue(0);
        vi.spyOn(MockSelfReport2, "score2_corp", "get").mockReturnValue(3);
        vi.spyOn(MockSelfReport2, "score2_runner", "get").mockReturnValue(3);
      });

      it("accepts a report", async () => {
        const { rerender } = renderEditRound();

        const table1Row = document.getElementsByClassName(
          "table_1",
        )[0] as HTMLElement;

        const reportsButton = within(table1Row).getByRole("button", {
          name: /reports/i,
        });
        expect(reportsButton).toContainElement(
          queryByTestId(reportsButton, "reportConflict"),
        );

        await user.click(reportsButton);

        const reportDialog = document.getElementById("reports1");
        expect(reportDialog).not.toBeNull();
        if (!reportDialog) {
          return;
        }
        const aliceAcceptButton = getByText(reportDialog, /accept alice/i);
        expect(reportDialog).toContainElement(
          getByText(reportDialog, /alice reported: 6 - 0/i),
        );
        expect(reportDialog).toContainElement(
          getByText(reportDialog, /bob reported: 0 - 6/i),
        );
        expect(reportDialog).toContainElement(aliceAcceptButton);
        expect(reportDialog).toContainElement(
          queryByText(reportDialog, /accept bob/i),
        );

        vi.spyOn(Pairing1, "reported", "get").mockReturnValue(true);
        vi.spyOn(Pairing1, "score1", "get").mockReturnValue(6);
        vi.spyOn(Pairing1, "score2", "get").mockReturnValue(0);
        await user.click(aliceAcceptButton);

        await rerender({ data: structuredClone(MockPageData) });

        expect(reportScore).toHaveBeenCalledOnce();
        expect(
          within(table1Row).getByRole("textbox", { name: /corp-score/i }),
        ).toHaveValue("6");
        expect(
          within(table1Row).getByRole("textbox", { name: /runner-score/i }),
        ).toHaveValue("0");
        expect(
          within(table1Row).getByRole("checkbox", {
            name: /intentional draw/i,
          }),
        ).not.toBeChecked();
      });

      it("resets the reports", async () => {
        const { rerender } = renderEditRound();

        const table1Row = document.getElementsByClassName(
          "table_1",
        )[0] as HTMLElement;
        const reportsButton = within(table1Row).getByRole("button", {
          name: /reports/i,
        });

        await user.click(reportsButton);

        const reportDialog = document.getElementById("reports1");
        expect(reportDialog).not.toBeNull();
        if (!reportDialog) {
          return;
        }

        vi.spyOn(Pairing1, "self_reports", "get").mockReturnValue(null);
        vi.spyOn(Pairing1, "reported", "get").mockReturnValue(false);
        vi.spyOn(Pairing1, "score1", "get").mockReturnValue(0);
        vi.spyOn(Pairing1, "score2", "get").mockReturnValue(0);
        await user.click(getByText(reportDialog, /reset/i));
        expect(resetReports).toHaveBeenCalledOnce();

        await rerender({ data: structuredClone(MockPageData) });

        await user.click(reportsButton);

        expect(reportDialog).not.toContainElement(
          queryByText(reportDialog, /alice reported: 6 - 0/i),
        );
        expect(reportDialog).not.toContainElement(
          queryByText(reportDialog, /bob reported: 0 - 6/i),
        );
        expect(reportDialog).not.toContainElement(
          queryByText(reportDialog, /accept alice/i),
        );
        expect(reportDialog).not.toContainElement(
          queryByText(reportDialog, /accept bob/i),
        );
      });
    });
  });
});
