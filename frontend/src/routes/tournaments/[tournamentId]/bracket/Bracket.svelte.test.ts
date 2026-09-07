import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/svelte";
import { get } from "svelte/store";
import BracketPage from "./+page.svelte";
import { showIdentities } from "$lib/utils/ShowIdentities";
import type { BracketData, BracketStage } from "$lib/model/Bracket";

describe("Bracket Page Container", () => {
  afterEach(() => {
    cleanup();
  });

  const mockElimStage: BracketStage = {
    name: "Top 4 Double Elimination",
    format: "double_elim",
    is_single_sided: true,
    is_elimination: true,
    player_count: 4,
    rounds: [
      {
        id: null,
        number: 1,
        pairings: [
          {
            id: null,
            table_number: 1,
            round: 1,
            winner_game: 3,
            loser_game: 4,
            bracket_type: "upper",
            player1: {
              id: 1,
              name_with_pronouns: "lia (she/her)",
              seed: 1,
              side: "corp",
              user_id: "1",
              side_label: "Corp",
              corp_id: { name: "Near-Earth Hub", faction: "nbn" },
              runner_id: { name: "Arissana", faction: "shaper" },
            },
            player2: {
              id: 4,
              name_with_pronouns: "wiggles (he/him)",
              seed: 4,
              side: "runner",
              user_id: "4",
              side_label: "Runner",
              corp_id: { name: "Jinteki PE", faction: "jinteki" },
              runner_id: { name: "Hoshiko", faction: "anarch" },
            },
          },
        ],
      },
    ],
  };

  const mockSwissStage: BracketStage = {
    name: "Swiss Stage",
    format: "swiss",
    is_single_sided: false,
    is_elimination: false,
    player_count: 4,
    rounds: [],
  };

  it("renders the Show/hide identities button and toggles identity state on click", async () => {
    const data: { bracket: BracketData } = {
      bracket: {
        stages: [mockElimStage],
      },
    };

    render(BracketPage, {
      props: {
        // Quiet this up just to tidy up the test data.
        // @ts-expect-error PageProps includes additional layout properties
        data,
      },
    });

    const button = screen.getByRole("button", { name: /show\/hide identities/i });
    expect(button).toBeDefined();

    const initialVal = get(showIdentities);
    await fireEvent.click(button);
    expect(get(showIdentities)).toBe(!initialVal);

    await fireEvent.click(button);
    expect(get(showIdentities)).toBe(initialVal);
  });

  it("renders 'No elimination bracket available.' when no elimination stages exist", () => {
    const data: { bracket: BracketData } = {
      bracket: {
        stages: [mockSwissStage],
      },
    };

    render(BracketPage, {
      props: {
        // Quiet this up just to tidy up the test data.
        // @ts-expect-error PageProps includes additional layout properties
        data,
      },
    });

    expect(screen.getByText("No elimination bracket available.")).toBeDefined();
    expect(screen.queryByRole("img", { name: "Bracket" })).toBeNull();
  });

  it("renders elimination stage heading and BracketDisplay when an elimination stage is present", () => {
    const data: { bracket: BracketData } = {
      bracket: {
        stages: [mockElimStage],
      },
    };

    render(BracketPage, {
      props: {
        // Quiet this up just to tidy up the test data.
        // @ts-expect-error PageProps includes additional layout properties
        data,
      },
    });

    expect(screen.getByRole("heading", { level: 4, name: "Top 4 Double Elimination" })).toBeDefined();
    expect(screen.getByRole("img", { name: "Bracket" })).toBeDefined();
    expect(screen.queryByText("No elimination bracket available.")).toBeNull();
  });
});
