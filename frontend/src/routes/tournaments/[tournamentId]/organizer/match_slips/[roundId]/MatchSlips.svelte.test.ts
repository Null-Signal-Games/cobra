import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import MatchSlips from "./+page.svelte";
import { Player } from "$lib/model/Player";
import type { Pairing } from "$lib/model/Pairing";
import type { Round } from "$lib/model/Round";
import { TournamentPolicies } from "$lib/model/Tournament";

const user = userEvent.setup();

describe("MatchSlips", () => {
  let mockPairings: Pairing[];
  let mockRound: Round;

  beforeAll(() => {
    mockPairings = Array.from({ length: 8 }, (_, i) => {
      const player1 = new Player();
      player1.name_with_pronouns = `Player ${i * 2 + 1}`;
      const player2 = new Player();
      player2.name_with_pronouns = `Player ${i * 2 + 2}`;

      return {
        id: i + 1,
        table_number: i + 1,
        table_label: "",
        policy: {
          self_report: false,
        },
        player1: player1,
        player2: player2,
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
      };
    });

    mockRound = {
      id: 1,
      number: 1,
      completed: false,
      pairings: mockPairings,
      pairings_reported: 0,
      length_minutes: 65,
      timer: {
        show: false,
        running: false,
        paused: false,
        started: false,
        state: {
          started: false,
          paused: false,
        },
      },
    };
  });

  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();

    render(MatchSlips, {
      props: {
        params: { tournamentId: "1", roundId: "1" },
        // @ts-expect-error PageProps additional layout data
        data: {
          round: mockRound,
          policy: new TournamentPolicies(),
        },
      },
    });
  });

  it("displays match slips", () => {
    const matchSlips = document.getElementsByClassName("match_slip");

    expect(matchSlips.length).toBe(8);
    for (let i = 0; i < 8; i++) {
      expect(matchSlips[i]).toHaveTextContent(`Round 1 - Table ${i + 1}`);
      expect(matchSlips[i]).toHaveTextContent(mockPairings[i].player1.name_with_pronouns);
      expect(matchSlips[i]).toHaveTextContent(mockPairings[i].player2.name_with_pronouns);
    }
  });

  it("displays collated match slips", async () => {
    await user.click(screen.getByRole("button", { name: /collate/i }));

    const matchSlips = document.getElementsByClassName("match_slip");

    expect(matchSlips.length).toBe(8);
    const collatedOrder = [0, 2, 4, 6, 1, 3, 5, 7];
    for (let i = 0; i < 8; i++) {
      const tableIndex = collatedOrder[i];
      expect(matchSlips[i]).toHaveTextContent(`Round 1 - Table ${tableIndex + 1}`);
      expect(matchSlips[i]).toHaveTextContent(mockPairings[tableIndex].player1.name_with_pronouns);
      expect(matchSlips[i]).toHaveTextContent(mockPairings[tableIndex].player2.name_with_pronouns);
    }
  });
});
