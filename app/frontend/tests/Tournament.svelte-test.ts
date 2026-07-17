import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  getByLabelText,
  getByRole,
  render,
  screen,
  waitFor,
} from "@testing-library/svelte";
import Tournament from "../tournaments/Tournament.svelte";
import { MockIdentityNames, MockTournament } from "./TournamentTestData";
import { MockPlayerBob } from "./RoundsTestData";
import { loadQRCode, loadTournament } from "../tournaments/TournamentSettings";
import { loadIdentityNames } from "../identities/Identity";
import userEvent from "@testing-library/user-event";
import { loadPlayerByUserId, Player, savePlayer } from "../players/PlayersData";

vi.mock("../tournaments/TournamentSettings", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../pairings/PairingsData")>()),
  loadTournament: vi.fn(() => MockTournament),
  loadQRCode: vi.fn(() => null),
}));

vi.mock("../identities/Identity", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../pairings/PairingsData")>()),
  loadIdentityNames: vi.fn(() => MockIdentityNames),
}));

vi.mock("../players/PlayersData", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../pairings/PairingsData")>()),
  loadPlayerByUserId: vi.fn(() => MockPlayerBob),
  savePlayer: vi.fn(() => true),
}));

const user = userEvent.setup();

describe("Tournament", () => {
  async function renderTournament(userId: number, userName?: string) {
    render(Tournament, { tournamentId: 1, userId: userId, userName: userName });

    await waitFor(() => {
      expect(loadTournament).toHaveBeenCalledOnce();
    });
    await waitFor(() => {
      expect(loadPlayerByUserId).toHaveBeenCalledOnce();
    });
    await waitFor(() => {
      expect(loadQRCode).toHaveBeenCalledOnce();
    });
  }

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.mocked(loadPlayerByUserId).mockImplementation(() =>
      Promise.resolve(MockPlayerBob),
    );

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

  describe("when player is logged out", () => {
    beforeEach(() => {
      vi.mocked(loadPlayerByUserId).mockImplementation(() =>
        Promise.resolve(new Player()),
      );
    });

    describe("when registration is open", () => {
      beforeEach(async () => {
        await renderTournament(-1);
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
      beforeEach(async () => {
        vi.spyOn(MockTournament, "registration_closed", "get").mockReturnValue(
          true,
        );

        await renderTournament(-1);
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
    describe("when player is not registered", () => {
      beforeEach(async () => {
        vi.mocked(loadPlayerByUserId).mockImplementation(() =>
          Promise.resolve(new Player()),
        );

        await renderTournament(MockPlayerBob.id, MockPlayerBob.name);
        await waitFor(() => {
          expect(loadIdentityNames).toHaveBeenCalledOnce();
        });
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
        await user.type(getByLabelText(registrationCard, "Corp ID"), "ban");
        await user.keyboard("{Enter}");
        await user.type(getByLabelText(registrationCard, "Runner ID"), "baz");
        await user.keyboard("{Enter}");
        await user.click(
          getByLabelText(
            registrationCard,
            "Include my games in video coverage",
          ),
        );

        await user.click(
          getByLabelText(registrationCard, "I agree to these terms"),
        );
        await user.click(
          getByRole(registrationCard, "button", { name: "Register" }),
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

        expect(savePlayer).toHaveBeenCalledExactlyOnceWith(1, bobEdit);
      });
    });

    describe("when player is registered", () => {
      describe("when player is active", () => {
        beforeEach(async () => {
          vi.spyOn(MockPlayerBob, "active", "get").mockReturnValue(true);
          await renderTournament(2);
          await waitFor(() => {
            expect(loadIdentityNames).toHaveBeenCalledOnce();
          });
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
        beforeEach(async () => {
          await renderTournament(2);
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
