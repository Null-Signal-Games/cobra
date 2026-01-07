import { fireEvent, render, within } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditRound from "../pairings/EditRound.svelte";
import { loadRound, type RoundData } from "../pairings/RoundData";
import { deletePairing, Tournament } from "../pairings/PairingsData";

vi.mock("../pairings/RoundData", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../pairings/RoundData")>()),
  loadRound: vi.fn(),
}));

vi.mock("../pairings/PairingsData", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../pairings/PairingsData")>()),
  deletePairing: vi.fn(),
}));

describe("EditRound", () => {
  const Player1 = {
    id: 1,
    name: "Alice",
    name_with_pronouns: "",
    side: null,
    user_id: null,
    side_label: null,
    corp_id: null,
    runner_id: null,
    include_in_stream: false,
    active: null,
  };
  const Player2 = {
    id: 2,
    name: "Bob",
    name_with_pronouns: "",
    side: null,
    user_id: null,
    side_label: null,
    corp_id: null,
    runner_id: null,
    include_in_stream: false,
    active: null,
  };
  const InitialRoundData: RoundData = {
    tournament: new Tournament(),
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
      pairings: [
        {
          id: 1,
          table_number: 1,
          table_label: "Table 1",
          policy: {
            self_report: false,
          },
          player1: Player1,
          player2: Player2,
          score1: 0,
          score1_corp: 0,
          score1_runner: 0,
          score2: 0,
          score2_corp: 0,
          score2_runner: 0,
          score_label: "",
          intentional_draw: false,
          two_for_one: false,
          self_reports: null,
          reported: false,
          winner_game: null,
          loser_game: null,
          bracket_type: null,
          ui_metadata: {
            row_highlighted: false,
          },
        },
      ],
      pairings_reported: 0,
      length_minutes: 0,
      timer: {
        running: false,
        paused: false,
        started: false,
      },
      unpaired_players: [],
    },
  };

  const UnpairedRoundData = structuredClone(InitialRoundData);
  UnpairedRoundData.round.pairings = [];
  UnpairedRoundData.round.unpaired_players = [Player1, Player2];

  beforeEach(async () => {
    vi.clearAllMocks();

    const { loadRound } = await import("../pairings/RoundData");
    vi.mocked(loadRound).mockResolvedValue(InitialRoundData);

    render(EditRound);
  });

  describe("delete pairings", () => {
    beforeEach(async () => {
      const { deletePairing } = await import("../pairings/PairingsData");
      vi.mocked(deletePairing).mockResolvedValue(true);

      vi.mocked(loadRound).mockResolvedValue(UnpairedRoundData);
    });

    it("deletes a pairing", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(true);

      const table1Row = document.getElementsByClassName(
        "table_1",
      )[0] as HTMLElement;
      await fireEvent.click(
        within(table1Row).getByRole("button", { name: /delete/i }),
      );
      expect(deletePairing).toHaveBeenCalledOnce();
      expect(loadRound).toHaveBeenCalledTimes(2);
      expect(table1Row).not.toBeInTheDocument();
    });

    it("does not delete a pairing if cancelled", async () => {
      vi.spyOn(window, "confirm").mockReturnValue(false);

      const table1Row = document.getElementsByClassName(
        "table_1",
      )[0] as HTMLElement;
      await fireEvent.click(
        within(table1Row).getByRole("button", { name: /delete/i }),
      );
      expect(deletePairing).not.toHaveBeenCalled();
      expect(loadRound).toHaveBeenCalledOnce();
      expect(table1Row).toBeInTheDocument();
    });
  });
});
