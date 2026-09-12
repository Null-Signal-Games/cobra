import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  getByLabelText,
  getByRole,
  render,
  screen,
} from "@testing-library/svelte";
import TournamentPage from "./+page.svelte";
import userEvent from "@testing-library/user-event";
import { Tournament } from "$lib/model/Tournament";
import type { IdentityNames } from "$lib/model/Identity";
import { Player } from "$lib/model/Player";
import type { ComponentProps } from "svelte";
import { authStore } from "$lib/utils/auth.svelte";
import { page } from "$app/state";
import { savePlayer } from "../api_helper";

export const MockTournament = new Tournament({
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
});

export const MockIdentityNames: IdentityNames = {
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

export const MockPlayerBob: Player = {
  id: 2,
  name: "Bob",
  pronouns: "he/him",
  name_with_pronouns: "Bob (he/him)",
  side: null,
  user_id: 2,
  side_label: null,
  corp_id: {
    name: "BANGUN: When Disaster Strikes",
    faction: "weyland-consortium",
  },
  runner_id: {
    name: "Barry “Baz” Wong: Tri-Maf Veteran",
    faction: "criminal",
  },
  registration_locked: false,
  include_in_stream: false,
  active: null,
  first_round_bye: false,
  manual_seed: null,
  fixed_table_number: null,
};

vi.mock("../api_helper", () => ({
  loadTournament: vi.fn(),
  loadPlayerByUserId: vi.fn(),
  loadIdentityNames: vi.fn(() => MockIdentityNames),
  savePlayer: vi.fn(),
}));

vi.mock('$app/env/public', () => {
  return {
    COBRA_API_SERVER: "http://localhost:3000"
  };
});

const user = userEvent.setup();

describe("Tournament", () => {
  const createProps = (
    player: Player
  ): ComponentProps<typeof TournamentPage> => ({
    params: {
      tournamentId: MockTournament.id.toString()
    },
    data: {
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
      player: player,
    },
  });

  function renderTournament(player: Player) {
    render(TournamentPage, { props: createProps(player) });
  }

  beforeEach(() => {
    vi.restoreAllMocks();

    vi.spyOn(page.url, "origin", "get").mockReturnValue("http://localhost:3000");

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

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    window.URL.createObjectURL = vi.fn().mockImplementation((data: Blob) => {
      return "";
    });
  });

  afterEach(() => {
    cleanup();
  });

  describe("when player is logged out", () => {
    beforeEach(() => {
      vi.spyOn(authStore, "isAuthenticated", "get").mockReturnValue(false);
    });

    describe("when registration is open", () => {
      beforeEach(() => {
        renderTournament(new Player());
      });

      it("displays tournament info and log in prompt", () => {
        // Tournament card
        expect(screen.getByLabelText("shortcode")).toHaveTextContent(
          "ABC1 (http://localhost:3000/ABC1)",
        );
        expect(screen.getByLabelText("date")).toHaveTextContent(
          "Tuesday, April 21, 2026",
        );
        expect(screen.getByLabelText("registration time")).toHaveTextContent(
          "10:00 AM",
        );
        expect(screen.getByLabelText("first round time")).toHaveTextContent(
          "11:00 AM",
        );
        expect(screen.getByLabelText("time zone")).toHaveTextContent("UTC");
        expect(screen.getByLabelText("tournament organiser")).toHaveTextContent(
          "Alice",
        );
        expect(screen.getByLabelText("player count")).toHaveTextContent(
          "17 active players (1 dropped)",
        );
        expect(screen.getByLabelText("QR code")).toHaveTextContent(
          "Open QR Code",
        );

        // Registration card
        const regInfoCard = screen.getByLabelText("registration information");
        expect(regInfoCard).toHaveTextContent("Sign in");
        expect(regInfoCard).toHaveTextContent("Create NRDB Account");

        // Additional details
        const detailsCard = screen.getByLabelText("additional details");
        expect(detailsCard).toHaveTextContent("Description This is a test tournament.");
        expect(detailsCard).toHaveTextContent("Swiss Format: Single-sided");
        expect(detailsCard).not.toHaveTextContent("Game Format:");
        expect(detailsCard).toHaveTextContent("Official Prize Kit 2026 Test Tournament Kit");
        expect(detailsCard).not.toHaveTextContent("Additional Prizes");
      });
    });

    describe("when registration is closed", () => {
      beforeEach(() => {
        vi.spyOn(MockTournament, "registration_closed", "get").mockReturnValue(
          true,
        );

        renderTournament(new Player());
      });

      it("does not display log in prompt", () => {
        expect(
          screen.getByLabelText("registration information"),
        ).not.toHaveTextContent("Sign in");
        expect(
          screen.getByLabelText("registration information"),
        ).not.toHaveTextContent("Create NRDB Account");
      });
    });
  });

  describe("when player is logged in", () => {
    beforeEach(() => {
      vi.spyOn(authStore, "user", "get").mockReturnValue({ id: MockPlayerBob.user_id, nrdb_id: 0, nrdb_username: MockPlayerBob.name });
      vi.spyOn(authStore, "isAuthenticated", "get").mockReturnValue(true);
    });

    describe("when player is not registered", () => {
      beforeEach(() => {
        renderTournament(new Player());
      });

      it("displays the user's name before registration", () => {
        expect(
          getByLabelText(
            screen.getByLabelText("registration information"),
            "Name",
          ),
        ).toHaveValue("Bob");
      });

      it("allows registration", async () => {
        const registrationCard = screen.getByLabelText(
          "registration information",
        );

        await user.clear(getByLabelText(registrationCard, "Name"));
        await user.type(getByLabelText(registrationCard, "Name"), "Bob Again");
        await user.type(
          getByLabelText(registrationCard, "Pronouns"),
          "they/them",
        );

        // The tab key presses here get around an error that occurs when the
        // user event attempts to click into the field.
        await user.type(getByLabelText(registrationCard, "Corp ID"), "{Tab}ban", { skipClick: true });
        await user.keyboard("{Enter}");
        await user.type(getByLabelText(registrationCard, "Runner ID"), "{Tab}baz", { skipClick: true });
        await user.keyboard("{Enter}");
        await user.click(
          getByLabelText(
            registrationCard,
            "Include my games in video coverage",
          ),
        );

        const bobEdit = new Player();
        bobEdit.name = "Bob Again";
        bobEdit.pronouns = "they/them";
        bobEdit.corp_id = {
          faction: null,
          name: "BANGUN: When Disaster Strikes",
        };
        bobEdit.runner_id = {
          faction: null,
          name: "Barry “Baz” Wong: Tri-Maf Veteran",
        };
        bobEdit.include_in_stream = true;

        vi.mocked(savePlayer).mockImplementation(() =>
          Promise.resolve(bobEdit),
        );

        await user.click(
          getByLabelText(registrationCard, "I agree to these terms"),
        );
        await user.click(
          getByRole(registrationCard, "button", { name: "Register" }),
        );

        expect(savePlayer).toHaveBeenCalledExactlyOnceWith("", 1, bobEdit);
      });
    });

    describe("when player is registered", () => {
      describe("when player is active", () => {
        beforeEach(() => {
          vi.spyOn(MockPlayerBob, "active", "get").mockReturnValue(true);

          renderTournament(MockPlayerBob);
        });

        it("displays player information", () => {
          const registrationCard = screen.getByLabelText(
            "registration information",
          );

          expect(getByLabelText(registrationCard, "name")).toHaveTextContent(
            "Bob",
          );
          expect(getByLabelText(registrationCard, "corp ID")).toHaveTextContent(
            "BANGUN: When Disaster Strikes",
          );
          expect(
            getByLabelText(registrationCard, "runner ID"),
          ).toHaveTextContent("Barry “Baz” Wong: Tri-Maf Veteran");
          expect(
            getByLabelText(registrationCard, "first round bye"),
          ).toHaveTextContent("NO");
          expect(
            getByLabelText(registrationCard, "stream my games"),
          ).toHaveTextContent("NO");
        });
      });

      describe("when player has dropped", () => {
        beforeEach(() => {
          renderTournament(MockPlayerBob);
        });

        it("shows rejoin text", () => {
          expect(
            screen.getByLabelText("registration information"),
          ).toHaveTextContent("Rejoin this Event");
        });
      });
    });
  });
});
