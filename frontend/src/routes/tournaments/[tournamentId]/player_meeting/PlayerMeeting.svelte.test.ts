import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/svelte";
import PlayerMeetingPage from "./+page.svelte";
import { createPlayerMeetingPairings, getBackDetails } from "./pairings";
import { Player } from "$lib/model/Player";
import { Tournament } from "$lib/model/Tournament";

function createPlayer(name: string): Player {
  const p = new Player();
  p.name = name;
  p.active = true;
  return p;
}

describe("createPlayerMeetingPairings", () => {
  it("sorts players alphabetically case-insensitively and pairs them in groups of 2", () => {
    const players = [
      createPlayer("David"),
      createPlayer("alan"),
      createPlayer("Ben"),
      createPlayer("callum"),
    ];

    const pairings = createPlayerMeetingPairings(players);

    expect(pairings.length).toBe(2);
    expect(pairings[0][0].name).toBe("alan");
    expect(pairings[0][1]?.name).toBe("Ben");
    expect(pairings[1][0].name).toBe("callum");
    expect(pairings[1][1]?.name).toBe("David");
  });

  it("handles odd number of players leaving the second player in the last pair undefined", () => {
    const players = [
      createPlayer("Jack"),
      createPlayer("Jill"),
      createPlayer("Snap"),
      createPlayer("Crackle"),
      createPlayer("Pop"),
    ];

    const pairings = createPlayerMeetingPairings(players);

    expect(pairings.length).toBe(3);
    expect(pairings[0][0].name).toBe("Crackle");
    expect(pairings[0][1]?.name).toBe("Jack");
    expect(pairings[1][0].name).toBe("Jill");
    expect(pairings[1][1]?.name).toBe("Pop");
    expect(pairings[2][0].name).toBe("Snap");
    expect(pairings[2][1]).toBeUndefined();
  });

  it("returns empty array when there are no players", () => {
    expect(createPlayerMeetingPairings([])).toEqual([]);
  });
});

describe("getBackDetails", () => {
  it("returns 'Back to Players' when coming from players view", () => {
    const details = getBackDetails("players", 14);
    expect(details.label).toBe("Back to Players");
    expect(details.path).toBe("/tournaments/14/organizer/players");
  });

  it("returns 'Back to Pairings' and organizer rounds path when coming from organizer rounds", () => {
    const details = getBackDetails("pairings", 14);
    expect(details.label).toBe("Back to Pairings");
    expect(details.path).toBe("/tournaments/14/organizer/rounds");
  });

  it("returns 'Back to Pairings' and public rounds path when coming from public rounds", () => {
    const details = getBackDetails("rounds", 14);
    expect(details.label).toBe("Back to Pairings");
    expect(details.path).toBe("/tournaments/14/rounds");
  });

  it("defaults to 'Back to Tournament' when backTo is missing or unrecognized", () => {
    expect(getBackDetails(null, 14)).toEqual({
      label: "Back to Tournament",
      path: "/tournaments/14",
    });
    expect(getBackDetails(undefined, 14)).toEqual({
      label: "Back to Tournament",
      path: "/tournaments/14",
    });
    expect(getBackDetails("", 14)).toEqual({
      label: "Back to Tournament",
      path: "/tournaments/14",
    });
    expect(getBackDetails("unrecognized_page", 14)).toEqual({
      label: "Back to Tournament",
      path: "/tournaments/14",
    });
  });
});

describe("PlayerMeeting Page Component", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  const mockTournament = new Tournament({
    id: 14,
    name: "Meeting Tournament",
    slug: "MEET14",
  });

  const mockPlayersData = {
    tournament: mockTournament,
    tournamentPolicies: {
      update: true,
      custom_table_numbering: false,
    },
    activePlayers: [
      createPlayer("Jack"),
      createPlayer("Jill"),
      createPlayer("Snap"),
      createPlayer("Crackle"),
      createPlayer("Pop"),
    ],
    droppedPlayers: [],
  };

  it("renders heading and table with correct headers and alphabetical pairings", () => {
    render(PlayerMeetingPage, {
      props: {
        params: { tournamentId: "14" },
        // @ts-expect-error PageProps additional layout data
        data: {
          players: mockPlayersData,
          back_to: null,
        },
      },
    });

    expect(screen.getByRole("heading", { level: 3, name: "Player meeting" })).toBeDefined();

    const table = screen.getByRole("table");
    expect(table).toBeDefined();

    expect(screen.getByRole("columnheader", { name: "#" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Player 1" })).toBeDefined();
    expect(screen.getByRole("columnheader", { name: "Player 2" })).toBeDefined();

    const rows = screen.getAllByRole("row");
    // Row 0 is the header, Rows 1..3 are data rows
    expect(rows.length).toBe(4);

    expect(rows[1].textContent).toContain("1");
    expect(rows[1].textContent).toContain("Crackle");
    expect(rows[1].textContent).toContain("Jack");

    expect(rows[2].textContent).toContain("2");
    expect(rows[2].textContent).toContain("Jill");
    expect(rows[2].textContent).toContain("Pop");

    expect(rows[3].textContent).toContain("3");
    expect(rows[3].textContent).toContain("Snap");
  });

  it("displays 'Back to Players' when back_to is players", () => {
    render(PlayerMeetingPage, {
      props: {
        params: { tournamentId: "14" },
        // @ts-expect-error PageProps additional layout data
        data: {
          players: mockPlayersData,
          back_to: "players",
        },
      },
    });

    const backButton = screen.getByRole("link", { name: /Back to Players/i });
    expect(backButton).toBeDefined();
    expect(backButton.getAttribute("href")).toBe("/tournaments/14/organizer/players");
  });

  it("displays 'Back to Pairings' when back_to is pairings (organizer)", () => {
    render(PlayerMeetingPage, {
      props: {
        params: { tournamentId: "14" },
        // @ts-expect-error PageProps additional layout data
        data: {
          players: mockPlayersData,
          back_to: "pairings",
        },
      },
    });

    const backButton = screen.getByRole("link", { name: /Back to Pairings/i });
    expect(backButton).toBeDefined();
    expect(backButton.getAttribute("href")).toBe("/tournaments/14/organizer/rounds");
  });

  it("displays 'Back to Pairings' when back_to is rounds (public)", () => {
    render(PlayerMeetingPage, {
      props: {
        params: { tournamentId: "14" },
        // @ts-expect-error PageProps additional layout data
        data: {
          players: mockPlayersData,
          back_to: "rounds",
        },
      },
    });

    const backButton = screen.getByRole("link", { name: /Back to Pairings/i });
    expect(backButton).toBeDefined();
    expect(backButton.getAttribute("href")).toBe("/tournaments/14/rounds");
  });

  it("defaults to 'Back to Tournament' when back_to is missing or unrecognized", () => {
    const { unmount } = render(PlayerMeetingPage, {
      props: {
        params: { tournamentId: "14" },
        // @ts-expect-error PageProps additional layout data
        data: {
          players: mockPlayersData,
          back_to: null,
        },
      },
    });

    let backButton = screen.getByRole("link", { name: /Back to Tournament/i });
    expect(backButton).toBeDefined();
    expect(backButton.getAttribute("href")).toBe("/tournaments/14");

    unmount();

    render(PlayerMeetingPage, {
      props: {
        params: { tournamentId: "14" },
        // @ts-expect-error PageProps additional layout data
        data: {
          players: mockPlayersData,
          back_to: "unrecognized_destination",
        },
      },
    });

    backButton = screen.getByRole("link", { name: /Back to Tournament/i });
    expect(backButton).toBeDefined();
    expect(backButton.getAttribute("href")).toBe("/tournaments/14");
  });
});
