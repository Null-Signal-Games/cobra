import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import PairingsByNamePage from "./+page.svelte";
import { formatPlayerDisplay, generatePairingsByName } from "./pairings_by_name";
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

describe("pairings_by_name helper logic", () => {
  it("formats player display with side for single-sided swiss", () => {
    const p = createPlayer("Alice", "(Corp)");
    expect(formatPlayerDisplay(p, true)).toBe("Alice (they/them) (Corp)");
  });

  it("formats player display without side for non-single-sided formats", () => {
    const p = createPlayer("Alice", "(Corp)");
    expect(formatPlayerDisplay(p, false)).toBe("Alice (they/them)");
  });

  it("formats null or undefined player as (Bye)", () => {
    expect(formatPlayerDisplay(null, false)).toBe("(Bye)");
    expect(formatPlayerDisplay(undefined, true)).toBe("(Bye)");
  });

  it("generates pairings by name listed twice and sorted alphabetically", () => {
    const jack = createPlayer("Jack");
    const jill = createPlayer("Jill");
    const snap = createPlayer("Snap");
    const crackle = createPlayer("Crackle");
    const pop = createPlayer("Pop");
    const bye = new Player();
    bye.name = "(Bye)";
    bye.name_with_pronouns = "(Bye)";

    const pairings = [
      createPairing(1, 1, jack, jill),
      createPairing(2, 2, snap, crackle),
      createPairing(3, 3, pop, bye),
    ];

    const rows = generatePairingsByName(pairings, "swiss", false);

    expect(rows).toHaveLength(6);
    expect(rows[0]).toEqual({
      pairingId: 3,
      tableNumber: 3,
      playerName: "(Bye)",
      opponentName: "Pop (they/them)",
    });
    expect(rows[1]).toEqual({
      pairingId: 2,
      tableNumber: 2,
      playerName: "Crackle (they/them)",
      opponentName: "Snap (they/them)",
    });
    expect(rows[2]).toEqual({
      pairingId: 1,
      tableNumber: 1,
      playerName: "Jack (they/them)",
      opponentName: "Jill (they/them)",
    });
    expect(rows[3]).toEqual({
      pairingId: 1,
      tableNumber: 1,
      playerName: "Jill (they/them)",
      opponentName: "Jack (they/them)",
    });
    expect(rows[4]).toEqual({
      pairingId: 3,
      tableNumber: 3,
      playerName: "Pop (they/them)",
      opponentName: "(Bye)",
    });
    expect(rows[5]).toEqual({
      pairingId: 2,
      tableNumber: 2,
      playerName: "Snap (they/them)",
      opponentName: "Crackle (they/them)",
    });
  });

  it("appends sides when format is single_sided_swiss", () => {
    const alice = createPlayer("Alice", "(Corp)");
    const bob = createPlayer("Bob", "(Runner)");
    const pairings = [createPairing(1, 1, alice, bob)];

    const rows = generatePairingsByName(pairings, "single_sided_swiss", true);

    expect(rows).toHaveLength(2);
    expect(rows[0].playerName).toBe("Alice (they/them) (Corp)");
    expect(rows[0].opponentName).toBe("Bob (they/them) (Runner)");
    expect(rows[1].playerName).toBe("Bob (they/them) (Runner)");
    expect(rows[1].opponentName).toBe("Alice (they/them) (Corp)");
  });

  it("returns an empty array when pairings is empty", () => {
    expect(generatePairingsByName([], "swiss", false)).toEqual([]);
  });
});

describe("PairingsByName Page Component", () => {
  const user = userEvent.setup();

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockStage: Stage = {
    id: 1,
    name: "Stage 1",
    format: "swiss",
    rounds: [],
    is_elimination: false,
    is_single_sided: false,
    view_decks: false,
  };

  const mockRound: Round = {
    id: 10,
    number: 2,
    completed: false,
    pairings: [
      createPairing(1, 1, createPlayer("Jack"), createPlayer("Jill")),
      createPairing(2, 2, createPlayer("Snap"), createPlayer("Crackle")),
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

  it("renders heading and pairings table sorted by player name", () => {
    render(PairingsByNamePage, {
      props: {
        params: { tournamentId: "7", roundId: "10" },
        // @ts-expect-error PageProps layout data
        data: {
          round: mockRound,
          stage: mockStage,
          policy: new TournamentPolicies(),
        },
      },
    });

    expect(
      screen.getByRole("heading", { level: 3, name: "Round 2 pairings" }),
    ).toBeDefined();

    expect(screen.getByText("Table")).toBeDefined();
    expect(screen.getByText("Player Name")).toBeDefined();
    expect(screen.getByText("Opponent")).toBeDefined();
    expect(screen.queryByText("Decks")).toBeNull();

    const backLink = screen.getByRole("link", { name: /Back to pairings/i });
    expect(backLink).toBeDefined();
    expect(backLink.getAttribute("href")).toBe(
      "/tournaments/7/organizer/rounds",
    );

    const rows = screen.getAllByRole("row");
    // Row 0 is header; Rows 1-4 are sorted players: Crackle, Jack, Jill, Snap
    expect(rows[1].textContent).toContain("2");
    expect(rows[1].textContent).toContain("Crackle (they/them)");
    expect(rows[1].textContent).toContain("Snap (they/them)");

    expect(rows[2].textContent).toContain("1");
    expect(rows[2].textContent).toContain("Jack (they/them)");
    expect(rows[2].textContent).toContain("Jill (they/them)");

    expect(rows[3].textContent).toContain("1");
    expect(rows[3].textContent).toContain("Jill (they/them)");
    expect(rows[3].textContent).toContain("Jack (they/them)");

    expect(rows[4].textContent).toContain("2");
    expect(rows[4].textContent).toContain("Snap (they/them)");
    expect(rows[4].textContent).toContain("Crackle (they/them)");
  });

  it("renders decks column and view decks links when view_decks is true", () => {
    const stageWithDecks: Stage = { ...mockStage, view_decks: true };

    render(PairingsByNamePage, {
      props: {
        params: { tournamentId: "7", roundId: "10" },
        // @ts-expect-error PageProps layout data
        data: {
          round: mockRound,
          stage: stageWithDecks,
          policy: new TournamentPolicies(),
        },
      },
    });

    expect(screen.getByText("Decks")).toBeDefined();
    const deckLinks = screen.getAllByRole("link", { name: /View decks/i });
    expect(deckLinks).toHaveLength(4);
    expect(deckLinks[0].getAttribute("href")).toContain(
      "/tournaments/7/rounds/10/pairings/2/view_decks?back_to=pairings",
    );
  });

  it("calls history.back when clicking back link if history exists", async () => {
    const historyBackSpy = vi.spyOn(window.history, "back").mockImplementation(() => {});
    Object.defineProperty(window.history, "length", { value: 3, configurable: true });

    render(PairingsByNamePage, {
      props: {
        params: { tournamentId: "7", roundId: "10" },
        // @ts-expect-error PageProps layout data
        data: {
          round: mockRound,
          stage: mockStage,
          policy: new TournamentPolicies(),
        },
      },
    });

    const backLink = screen.getByRole("link", { name: /Back to pairings/i });
    await user.click(backLink);

    expect(historyBackSpy).toHaveBeenCalledOnce();
  });

  it("renders round not found message if round or stage is missing", () => {
    render(PairingsByNamePage, {
      props: {
        params: { tournamentId: "7", roundId: "99" },
        // @ts-expect-error PageProps layout data
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
