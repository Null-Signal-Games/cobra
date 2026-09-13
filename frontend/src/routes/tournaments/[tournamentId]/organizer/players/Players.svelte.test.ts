import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  getByLabelText,
  getByRole,
  render,
  screen,
} from "@testing-library/svelte";
import userEvent from "@testing-library/user-event";
import PlayersPage from "./+page.svelte";
import type { PageProps } from "./$types";
import { Player, type PlayersData } from "$lib/model/Player";
import {
  CutDeckVisibility,
  deckVisibilityString,
  SwissDeckVisibility,
  Tournament,
} from "$lib/model/Tournament";
import type { IdentityNames } from "$lib/model/Identity";
import { invalidateAll } from "$app/navigation";
import {
  deletePlayer,
  dropPlayer,
  reinstatePlayer,
  savePlayer,
  saveTournament,
  setPlayerRegistrationStatus,
  setRegistrationStatus,
  togglePlayerLock,
} from "../../../api_helper";

const user = userEvent.setup();

let currentTournament: Tournament;
let mockAlice: Player;
let mockBob: Player;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let rerenderFn: ((props: any) => Promise<void>) | null = null;

vi.mock("$app/navigation", () => ({
  invalidateAll: vi.fn(async () => {
    if (rerenderFn) {
      const clonedTournament = new Tournament(currentTournament);
      await rerenderFn({
        params: { tournamentId: "1" },
        data: {
          players: {
            tournament: clonedTournament,
            tournamentPolicies: {
              update: true,
              custom_table_numbering: false,
            },
            activePlayers: [mockAlice, mockBob],
            droppedPlayers: [],
          },
          identities: MockIdentityNames,
        },
      });
    }
  }),
}));

vi.mock("../../../api_helper", () => ({
  saveTournament: vi.fn((tournament: Tournament) => {
      currentTournament.swiss_deck_visibility = tournament.swiss_deck_visibility;
      currentTournament.cut_deck_visibility = tournament.cut_deck_visibility;
    return Promise.resolve(true);
  }),
  setPlayerRegistrationStatus: vi.fn((_id: number, locked: boolean) => {
    currentTournament.all_players_unlocked = !locked;
    currentTournament.any_player_unlocked = !locked;
    return Promise.resolve(true);
  }),
  setRegistrationStatus: vi.fn((_id: number, open: boolean) => {
    currentTournament.registration_closed = !open;
    return Promise.resolve(true);
  }),
  reinstatePlayer: vi.fn(() => Promise.resolve(true)),
  savePlayer: vi.fn(() => Promise.resolve(new Player())),
  deletePlayer: vi.fn(() => Promise.resolve(true)),
  togglePlayerLock: vi.fn(() => Promise.resolve(true)),
  dropPlayer: vi.fn(() => Promise.resolve(true)),
  loadDecks: vi.fn(() => Promise.resolve([])),
  loadPlayers: vi.fn(),
  loadIdentityNames: vi.fn(),
}));

function createMockTournament(overrides?: Partial<Tournament>) {
  return new Tournament({
    id: 1,
    name: "Mock Tournament",
    slug: "ABC1",
    user_id: 1,
    tournament_organizer: "Alice",
    date: "2026-04-21",
    registration_starts: "2026-04-21T10:00:00",
    tournament_starts: "2026-04-21T11:00:00",
    description: "This is a test tournament.",
    official_prize_kit_id: 1,
    official_prize_kit_name: "2026 Test Tournament Kit",
    self_registration: true,
    all_players_unlocked: true,
    any_player_unlocked: true,
    allow_streaming_opt_out: true,
    swiss_format: "single_sided",
    registration_closed: false,
    active_player_count: 17,
    dropped_player_count: 1,
    nrdb_deck_registration: true,
    swiss_deck_visibility: SwissDeckVisibility.Private,
    cut_deck_visibility: CutDeckVisibility.Private,
    ...overrides,
  });
}

const MockIdentityNames: IdentityNames = {
  corp: [
    {
      label: "A Teia: IP Recovery",
      value: "A Teia: IP Recovery",
    },
    {
      label: "BANGUN: When Disaster Strikes",
      value: "BANGUN: When Disaster Strikes",
    },
  ],
  runner: [
    {
      label: "Arissana Rocha Nahu: Street Artist",
      value: "Arissana Rocha Nahu: Street Artist",
    },
    {
      label: "Barry “Baz” Wong: Tri-Maf Veteran",
      value: "Barry “Baz” Wong: Tri-Maf Veteran",
    },
  ],
};

function createMockAlice(): Player {
  return {
    id: 1,
    name: "Alice",
    pronouns: "she/her",
    name_with_pronouns: "",
    user_id: 1,
    corp_id: {
      name: "A Teia: IP Recovery",
      faction: null,
    },
    runner_id: {
      name: "Arissana Rocha Nahu: Street Artist",
      faction: null,
    },
    registration_locked: false,
    include_in_stream: true,
    active: null,
    first_round_bye: false,
    manual_seed: null,
    fixed_table_number: null,
    side: "corp",
    side_label: null,
  };
}

function createMockBob(): Player {
  return {
    id: 2,
    name: "Bob",
    pronouns: "he/him",
    name_with_pronouns: "",
    user_id: 2,
    corp_id: {
      name: "BANGUN: When Disaster Strikes",
      faction: "weyland-consortium",
    },
    runner_id: {
      name: "Barry “Baz” Wong: Tri-Maf Veteran",
      faction: "criminal",
    },
    registration_locked: true,
    include_in_stream: false,
    active: null,
    first_round_bye: true,
    manual_seed: null,
    fixed_table_number: 1,
    side: "runner",
    side_label: null,
  };
}

describe("Players", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("when there are no dropped players", () => {
    function renderComponent(tournamentOverrides?: Partial<Tournament>) {
      const tournament = $state(createMockTournament(tournamentOverrides));
      currentTournament = tournament;
      mockAlice = createMockAlice();
      mockBob = createMockBob();

      const playersData: PlayersData = $state({
        tournament,
        tournamentPolicies: {
          update: true,
          custom_table_numbering: false,
        },
        activePlayers: [mockAlice, mockBob],
        droppedPlayers: [],
      });

      const res = render(PlayersPage, {
        props: {
          params: { tournamentId: "1" },
          data: {
            players: playersData,
            identities: MockIdentityNames,
          } as PageProps["data"],
        },
      });
      rerenderFn = res.rerender;
      return res;
    }

    beforeEach(() => {
      renderComponent();
    });

    it("displays active players", () => {
      const playerItems = screen.getAllByRole("listitem");

      expect(playerItems).toHaveLength(2);
      expect(getByLabelText(playerItems[0], "Name")).toHaveValue("Alice");
      expect(getByLabelText(playerItems[0], "Pronouns")).toHaveValue("she/her");
      expect(
        playerItems[0].querySelector('select[name="player_corp_id_1"]'),
      ).toHaveValue("A Teia: IP Recovery");
      expect(
        playerItems[0].querySelector('select[name="player_runner_id_1"]'),
      ).toHaveValue("Arissana Rocha Nahu: Street Artist");
      expect(
        getByRole(playerItems[0], "checkbox", {
          name: "Video coverage allowed",
        }),
      ).toBeChecked();
      expect(
        getByRole(playerItems[0], "checkbox", { name: "First round bye" }),
      ).not.toBeChecked();
      expect(getByLabelText(playerItems[0], "Fixed table number")).toHaveValue(
        null,
      );
      expect(getByLabelText(playerItems[1], "Name")).toHaveValue("Bob");
      expect(getByLabelText(playerItems[1], "Pronouns")).toHaveValue("he/him");
      expect(
        playerItems[1].querySelector('select[name="player_corp_id_2"]'),
      ).toHaveValue("BANGUN: When Disaster Strikes");
      expect(
        playerItems[1].querySelector('select[name="player_runner_id_2"]'),
      ).toHaveValue("Barry “Baz” Wong: Tri-Maf Veteran");
      expect(
        getByRole(playerItems[1], "checkbox", {
          name: "Video coverage allowed",
        }),
      ).not.toBeChecked();
      expect(
        getByRole(playerItems[1], "checkbox", { name: "First round bye" }),
      ).toBeChecked();
      expect(getByLabelText(playerItems[1], "Fixed table number")).toHaveValue(
        1,
      );
    });

    it("locks a player", async () => {
      const playerItems = screen.getAllByRole("listitem");

      await user.click(
        getByRole(playerItems[0], "button", { name: "Lock player" }),
      );

      const aliceEdit = structuredClone(mockAlice);
      aliceEdit.registration_locked = true;

      expect(togglePlayerLock).toHaveBeenCalledExactlyOnceWith(1, aliceEdit);
      expect(invalidateAll).toHaveBeenCalledOnce();
    });

    it("unlocks a player", async () => {
      const playerItems = screen.getAllByRole("listitem");

      await user.click(
        getByRole(playerItems[1], "button", { name: "Unlock player" }),
      );

      const bobEdit = structuredClone(mockBob);
      bobEdit.registration_locked = false;

      expect(togglePlayerLock).toHaveBeenCalledExactlyOnceWith(1, bobEdit);
      expect(invalidateAll).toHaveBeenCalledOnce();
    });

    it("saves player edits", async () => {
      const playerItems = screen.getAllByRole("listitem");

      await user.clear(getByLabelText(playerItems[0], "Name"));
      await user.type(getByLabelText(playerItems[0], "Name"), "Alice test");
      await user.clear(getByLabelText(playerItems[0], "Pronouns"));
      await user.type(getByLabelText(playerItems[0], "Pronouns"), "te/st");
      await user.click(
        getByRole(playerItems[0], "checkbox", {
          name: "Video coverage allowed",
        }),
      );
      await user.click(
        getByRole(playerItems[0], "checkbox", { name: "First round bye" }),
      );
      await user.clear(getByLabelText(playerItems[0], "Fixed table number"));
      await user.type(
        getByLabelText(playerItems[0], "Fixed table number"),
        "1",
      );

      await user.click(getByRole(playerItems[0], "button", { name: "Save" }));

      const aliceEdit = structuredClone(mockAlice);
      aliceEdit.name = "Alice test";
      aliceEdit.pronouns = "te/st";
      aliceEdit.include_in_stream = false;
      aliceEdit.first_round_bye = true;
      aliceEdit.fixed_table_number = 1;

      expect(savePlayer).toHaveBeenCalledExactlyOnceWith(1, aliceEdit, true);
      expect(invalidateAll).toHaveBeenCalledOnce();
    });

    it("drops a player", async () => {
      const playerItems = screen.getAllByRole("listitem");

      await user.click(getByRole(playerItems[0], "button", { name: "Drop" }));

      expect(dropPlayer).toHaveBeenCalledExactlyOnceWith(1, mockAlice);
      expect(invalidateAll).toHaveBeenCalledOnce();
    });

    it("deletes a player", async () => {
      const playerItems = screen.getAllByRole("listitem");

      vi.spyOn(window, "confirm").mockReturnValue(true);
      await user.click(getByRole(playerItems[0], "button", { name: "Delete" }));

      expect(deletePlayer).toHaveBeenCalledExactlyOnceWith(1, mockAlice);
      expect(invalidateAll).toHaveBeenCalledOnce();
    });

    describe.each([
      [true, true, "open"],
      [true, false, "closed"],
      [false, true, "open, all locked"],
      [false, false, "closed"],
    ])("sets lock and registration status", (unlock, open, description) => {
      it(description, async () => {
        let invalidateCount = 0;

        const dropdown = screen.getByText(/Registration: .*/);
        await user.click(dropdown);

        const lockOption = screen.getByText(
          new RegExp(`${unlock ? "Unlock" : "Lock"} all players.*`),
        );
        if (!lockOption.classList.contains("disabled")) {
          await user.click(lockOption);
          invalidateCount++;
          expect(setPlayerRegistrationStatus).toHaveBeenCalledExactlyOnceWith(
            1,
            !unlock,
          );
        }

        const registrationOption = screen.getByText(
          new RegExp(`${open ? "Open" : "Close"} registration.*`),
        );
        if (!registrationOption.classList.contains("disabled")) {
          await user.click(registrationOption);
          invalidateCount++;
          expect(setRegistrationStatus).toHaveBeenCalledExactlyOnceWith(
            1,
            open,
          );
        }

        expect(invalidateAll).toHaveBeenCalledTimes(invalidateCount);
        expect(dropdown).toHaveTextContent(`Registration: ${description}`);
      });
    });

    describe.each([
      [
        SwissDeckVisibility.Private,
        CutDeckVisibility.Private,
        "swiss private, cut private",
      ],
      [
        SwissDeckVisibility.Private,
        CutDeckVisibility.Open,
        "swiss private, cut open",
      ],
      [
        SwissDeckVisibility.Private,
        CutDeckVisibility.Public,
        "swiss private, cut public",
      ],
      [
        SwissDeckVisibility.Open,
        CutDeckVisibility.Private,
        "swiss open, cut private",
      ],
      [
        SwissDeckVisibility.Open,
        CutDeckVisibility.Open,
        "swiss open, cut open",
      ],
      [
        SwissDeckVisibility.Open,
        CutDeckVisibility.Public,
        "swiss open, cut public",
      ],
      [
        SwissDeckVisibility.Public,
        CutDeckVisibility.Private,
        "swiss public, cut private",
      ],
      [
        SwissDeckVisibility.Public,
        CutDeckVisibility.Open,
        "swiss public, cut open",
      ],
      [
        SwissDeckVisibility.Public,
        CutDeckVisibility.Public,
        "swiss public, cut public",
      ],
    ])(
      "sets deck visibility",
      (swissVisibility, cutVisibility, description) => {
        it(description, async () => {
          let invalidateCount = 0;

          vi.spyOn(window, "confirm").mockReturnValue(true);
          const tournamentEdit = structuredClone(currentTournament);

          const dropdown = screen.getByText(/Decks: .*/);
          await user.click(dropdown);

          const swissOption = screen.getByText(
            new RegExp(
              `Make decks in swiss ${deckVisibilityString(swissVisibility)}.*`,
            ),
          );
          if (!swissOption.classList.contains("disabled")) {
            await user.click(swissOption);
            invalidateCount++;

            tournamentEdit.swiss_deck_visibility = swissVisibility;
            expect(saveTournament).toHaveBeenCalledWith(tournamentEdit);
          }

          const cutOption = screen.getByText(
            new RegExp(
              `Make decks in cut ${deckVisibilityString(cutVisibility)}.*`,
            ),
          );
          if (!cutOption.classList.contains("disabled")) {
            await user.click(cutOption);
            invalidateCount++;

            tournamentEdit.cut_deck_visibility = cutVisibility;
            expect(saveTournament).toHaveBeenCalledWith(tournamentEdit);
          }

          expect(invalidateAll).toHaveBeenCalledTimes(invalidateCount);
          expect(dropdown).toHaveTextContent(`Decks: ${description}`);
        });
      },
    );

    it("saves new player", async () => {
      const newPlayerSection = screen.getByRole("heading", {
        name: "Register New Player",
      }).parentElement;
      expect(newPlayerSection).not.toBeNull();
      if (!newPlayerSection) {
        return;
      }

      await user.type(getByLabelText(newPlayerSection, "Name"), "Charlie");
      await user.type(
        getByLabelText(newPlayerSection, "Pronouns"),
        "they/them",
      );
      await user.click(
        getByRole(newPlayerSection, "checkbox", {
          name: "Video coverage allowed",
        }),
      );
      await user.click(
        getByRole(newPlayerSection, "checkbox", { name: "First round bye" }),
      );
      await user.type(
        getByLabelText(newPlayerSection, "Fixed table number"),
        "1",
      );

      await user.click(
        getByRole(newPlayerSection, "button", { name: "Create" }),
      );

      const charlieEdit = new Player();
      charlieEdit.name = "Charlie";
      charlieEdit.pronouns = "they/them";
      charlieEdit.corp_id = { faction: null, name: "" };
      charlieEdit.runner_id = { faction: null, name: "" };
      charlieEdit.include_in_stream = true;
      charlieEdit.first_round_bye = true;
      charlieEdit.fixed_table_number = 1;

      expect(savePlayer).toHaveBeenCalledExactlyOnceWith(1, charlieEdit, true);
      expect(invalidateAll).toHaveBeenCalledOnce();
    });
  });

  describe("when there are dropped players", () => {
    let mockBob: Player;

    beforeEach(() => {
      const tournament = $state(createMockTournament());
      currentTournament = tournament;
      const mockAlice = createMockAlice();
      mockBob = createMockBob();

      const playersData: PlayersData = $state({
        tournament,
        tournamentPolicies: {
          update: true,
          custom_table_numbering: false,
        },
        activePlayers: [mockAlice],
        droppedPlayers: [mockBob],
      });

      render(PlayersPage, {
        props: {
          params: { tournamentId: "1" },
          data: {
            players: playersData,
            identities: MockIdentityNames,
          } as PageProps["data"],
        },
      });
    });

    it("reinstates dropped players", async () => {
      const droppedPlayerRows = screen.getAllByRole("row");

      expect(screen.getAllByRole("listitem")).toHaveLength(1);
      expect(droppedPlayerRows).toHaveLength(1);

      await user.click(
        getByRole(droppedPlayerRows[0], "button", { name: "Reinstate" }),
      );

      expect(reinstatePlayer).toHaveBeenCalledExactlyOnceWith(1, mockBob);
      expect(invalidateAll).toHaveBeenCalledOnce();
    });
  });
});
