import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import ExportMarkdownPage from "./+page.svelte";
import { generateMarkdownPages } from "./markdown";
import { Player } from "$lib/model/Player";
import type { Pairing } from "$lib/model/Pairing";
import type { Round } from "$lib/model/Round";
import type { Stage } from "$lib/model/Stage";
import { TournamentPolicies } from "$lib/model/Tournament";

function createPlayer(name: string, sideLabel?: string): Player {
  const p = new Player();
  p.name = name;
  p.name_with_pronouns = `${name} (they/them)`;
  p.side_label = sideLabel ?? null;
  return p;
}

function createPairing(id: number, tableNumber: number, player1: Player, player2: Player): Pairing {
  return {
    id,
    table_number: tableNumber,
    table_label: "",
    policy: {
      self_report: false,
    },
    player1,
    player2,
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
}

describe("generateMarkdownPages", () => {
  it("generates markdown for pairings in a round", () => {
    const p1 = createPlayer("Alice", "Corp");
    const p2 = createPlayer("Bob", "Runner");
    const pairing = createPairing(1, 1, p1, p2);

    const pages = generateMarkdownPages("Swiss", 1, [pairing], false);
    expect(pages.length).toBe(1);
    expect(pages[0]).toContain("# Swiss - Round 1 Pairings");
    expect(pages[0]).toContain("### Table 1");
    expect(pages[0]).toContain("- **Alice (they/them)**");
    expect(pages[0]).toContain("- **Bob (they/them)**");
    expect(pages[0]).not.toContain("Corp");
  });

  it("includes side labels when is_single_sided is true", () => {
    const p1 = createPlayer("Alice", "Corp");
    const p2 = createPlayer("Bob", "Runner");
    const pairing = createPairing(1, 1, p1, p2);

    const pages = generateMarkdownPages("Swiss", 2, [pairing], true);
    expect(pages.length).toBe(1);
    expect(pages[0]).toContain("- **Alice (they/them)** - Corp");
    expect(pages[0]).toContain("- **Bob (they/them)** - Runner");
  });

  it("splits markdown into multiple pages when exceeding maxLength", () => {
    const pairings = Array.from({ length: 20 }, (_, i) =>
      createPairing(i + 1, i + 1, createPlayer(`Player${i * 2 + 1}`), createPlayer(`Player${i * 2 + 2}`)),
    );

    // Using small limit to test splitting
    const pages = generateMarkdownPages("Swiss", 1, pairings, false, 300);
    expect(pages.length).toBeGreaterThan(1);
    for (const page of pages) {
      expect(page).toContain("# Swiss - Round 1 Pairings");
    }
  });

  it("returns empty array when pairings are empty", () => {
    expect(generateMarkdownPages("Swiss", 1, [], false)).toEqual([]);
  });
});

describe("ExportMarkdown Page Component", () => {
  const user = userEvent.setup();

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockStage: Stage = {
    id: 1,
    name: "Stage 1",
    format: "Swiss",
    rounds: [],
    is_elimination: false,
    is_single_sided: false,
    view_decks: false,
  };

  const mockRound: Round = {
    id: 10,
    number: 3,
    completed: false,
    pairings: [
      createPairing(1, 1, createPlayer("Alice"), createPlayer("Bob")),
      createPairing(2, 2, createPlayer("Charlie"), createPlayer("David")),
    ],
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

  it("renders export markdown heading, textarea, and copy button", () => {
    render(ExportMarkdownPage, {
      props: {
        params: { tournamentId: "14", roundId: "10" },
        // @ts-expect-error PageProps additional layout data
        data: {
          round: mockRound,
          stage: mockStage,
          policy: new TournamentPolicies(),
        },
      },
    });

    expect(screen.getByRole("heading", { level: 2, name: "Export Pairings as Markdown" })).toBeDefined();
    expect(screen.getByText("Page 1")).toBeDefined();

    const textarea = screen.getByRole<HTMLTextAreaElement>("textbox");
    expect(textarea.value).toContain("# Swiss - Round 3 Pairings");
    expect(textarea.value).toContain("### Table 1");
    expect(textarea.value).toContain("- **Alice (they/them)**");
  });

  it("copies markdown text when clicking Copy button", async () => {
    const writeTextSpy = vi
      .spyOn(navigator.clipboard, "writeText")
      .mockImplementation(() => Promise.resolve());

    render(ExportMarkdownPage, {
      props: {
        params: { tournamentId: "14", roundId: "10" },
        // @ts-expect-error PageProps additional layout data
        data: {
          round: mockRound,
          stage: mockStage,
          policy: new TournamentPolicies(),
        },
      },
    });

    const copyButton = screen.getByRole("button", { name: /Copy/i });
    await user.click(copyButton);

    expect(writeTextSpy).toHaveBeenCalledOnce();
    expect(writeTextSpy).toHaveBeenCalledWith(expect.stringContaining("# Swiss - Round 3 Pairings"));
  });

  it("renders round not found message if round or stage is missing", () => {
    render(ExportMarkdownPage, {
      props: {
        params: { tournamentId: "14", roundId: "99" },
        // @ts-expect-error PageProps additional layout data
        data: {
          round: null,
          stage: null,
          policy: new TournamentPolicies(),
        },
      },
    });

    expect(screen.getByText("Round not found.")).toBeDefined();
  });
});
