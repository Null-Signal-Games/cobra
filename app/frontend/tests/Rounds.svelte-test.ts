import { fireEvent, render, within } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deletePairing,
  loadPairings,
  PairingsData,
  Tournament,
} from "../pairings/PairingsData";
import Rounds from "../pairings/Rounds.svelte";

vi.mock("../pairings/PairingsData", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../pairings/PairingsData")>()),
  loadPairings: vi.fn(),
  deletePairing: vi.fn(),
}));

describe("Rounds", () => {
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
  const InitialPairingsData: PairingsData = {
    tournament: new Tournament(),
    policy: { update: true, custom_table_numbering: false },
    stages: [
      {
        id: 1,
        name: "Swiss",
        format: "swiss",
        is_single_sided: false,
        is_elimination: false,
        view_decks: false,
        rounds: [
          {
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
        ],
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("as organizer", () => {
    const UnpairedPairingsData = structuredClone(InitialPairingsData);
    UnpairedPairingsData.stages[0].rounds[0].pairings = [];
    UnpairedPairingsData.stages[0].rounds[0].unpaired_players = [
      Player1,
      Player2,
    ];

    beforeEach(() => {
      vi.mocked(loadPairings).mockResolvedValue(InitialPairingsData);

      render(Rounds);
    });

    it("deletes a pairing", async () => {
      vi.mocked(deletePairing).mockResolvedValue(true);
      vi.mocked(loadPairings).mockResolvedValue(UnpairedPairingsData);
      vi.spyOn(window, "confirm").mockReturnValue(true);

      const table1Row = document.getElementsByClassName(
        "table_1",
      )[0] as HTMLElement;
      await fireEvent.click(
        within(table1Row).getByRole("button", { name: /delete/i }),
      );
      expect(deletePairing).toHaveBeenCalledOnce();
      expect(loadPairings).toHaveBeenCalledTimes(2);
      expect(table1Row).not.toBeInTheDocument();
    });

    it("does not delete a pairing if cancelled", async () => {
      vi.mocked(deletePairing).mockResolvedValue(true);
      vi.mocked(loadPairings).mockResolvedValue(UnpairedPairingsData);
      vi.spyOn(window, "confirm").mockReturnValue(false);

      const table1Row = document.getElementsByClassName(
        "table_1",
      )[0] as HTMLElement;
      await fireEvent.click(
        within(table1Row).getByRole("button", { name: /delete/i }),
      );
      expect(deletePairing).not.toHaveBeenCalled();
      expect(loadPairings).toHaveBeenCalledOnce();
      expect(table1Row).toBeInTheDocument();
    });
  });

  describe("as player", () => {
    const UserPairingsData = structuredClone(InitialPairingsData);
    UserPairingsData.policy.update = false;

    beforeEach(() => {
      vi.mocked(loadPairings).mockResolvedValue(UserPairingsData);

      render(Rounds);
    });

    it("does not show the Delete button", () => {
      const table1Row = document.getElementsByClassName(
        "table_1",
      )[0] as HTMLElement;
      const deleteButton = within(table1Row).queryByRole("button", {
        name: /delete/i,
      });
      expect(table1Row).not.toContainElement(deleteButton);
    });
  });
});
